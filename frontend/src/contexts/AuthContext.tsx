/* @refresh reload */
import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../api'

interface AuthContextType {
  user: { username: string } | null
  token: string | null
  isAuthenticated: boolean
  isAuthLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getStoredAuth() {
  if (typeof window === 'undefined') {
    return { token: null, user: null }
  }

  const token = localStorage.getItem('crm_token')
  const username = localStorage.getItem('crm_username')

  return {
    token,
    user: token && username ? { username } : null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const storedAuth = getStoredAuth()
  const [user, setUser] = useState<{ username: string } | null>(storedAuth.user)
  const [token, setToken] = useState<string | null>(storedAuth.token)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const navigate = useNavigate()

  // Validate stored token on mount
  React.useEffect(() => {
    const validateAuth = async () => {
      try {
        if (storedAuth.token) {
          // Token exists, mark as authenticated
          setToken(storedAuth.token)
          setUser(storedAuth.user)
        } else {
          // Explicitly keep app in logged-out state when no token exists.
          setToken(null)
          setUser(null)
        }
      } catch (error) {
        console.error('Auth validation error:', error)
        localStorage.removeItem('crm_token')
        localStorage.removeItem('crm_username')
        setToken(null)
        setUser(null)
      } finally {
        setIsAuthLoading(false)
      }
    }

    validateAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await api.login(username, password)
      const { token: newToken, username: returnedUsername } = response
      
      localStorage.setItem('crm_token', newToken)
      localStorage.setItem('crm_username', returnedUsername)
      
      setToken(newToken)
      setUser({ username: returnedUsername })
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('crm_token')
      localStorage.removeItem('crm_username')
      setToken(null)
      setUser(null)
      navigate('/login')
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    isAuthLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
