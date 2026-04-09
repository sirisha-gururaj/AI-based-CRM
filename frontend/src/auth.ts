// Auth utilities using token-based authentication
export const TOKEN_KEY = 'crm_token'

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(TOKEN_KEY)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
