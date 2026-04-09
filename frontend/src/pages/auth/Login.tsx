import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Check, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const FEATURES = [
  'Multi-tenant architecture with RLS',
  'AI Copilot powered by local LLM',
  'Predictive lead scoring',
]

export default function Login() {
  const navigate = useNavigate()
  const { login: apiLogin } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username || !password) {
      setError('Please enter your username and password.')
      return
    }
    setLoading(true)
    try {
      await apiLogin(username, password)
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex w-1/2 flex-col items-center justify-center px-16 gap-10"
        style={{ backgroundColor: '#0f2744' }}
      >
        {/* Logo + name */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#2563eb' }}
          >
            <span className="text-white font-bold text-3xl select-none">AI</span>
          </div>

          <div>
            <h1 className="text-white font-bold text-4xl leading-tight">
              AI CRM Platform
            </h1>
            <p className="text-blue-300 text-base mt-2">
              AI-Enabled Sales &amp; Marketing Management
            </p>
          </div>
        </div>

        {/* Feature bullets */}
        <ul className="flex flex-col gap-4 w-full max-w-xs">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                style={{ backgroundColor: '#2563eb' }}
              >
                <Check size={12} color="white" strokeWidth={3} />
              </span>
              <span className="text-blue-100 text-sm leading-snug">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Heading */}
          <h2
            className="font-bold text-3xl mb-1"
            style={{ color: '#1e3a5f' }}
          >
            Welcome back
          </h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to your account</p>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 pr-11 text-sm text-gray-900 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition disabled:cursor-not-allowed"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: loading ? '#94a3b8' : '#2563eb' }}
              onMouseEnter={(e) => {
                if (!loading) ((e.target as HTMLButtonElement).style.backgroundColor = '#1d4ed8')
              }}
              onMouseLeave={(e) => {
                if (!loading) ((e.target as HTMLButtonElement).style.backgroundColor = '#2563eb')
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Sign-up link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
