import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { authAPI } from '../api'
import type { User } from '../api'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, twoFactorToken?: string) => Promise<{ requiresTwoFactor?: boolean; success?: boolean; user?: User } | void>
  register: (email: string, password: string, name: string) => Promise<void>
  loginWithOAuth: (provider: 'google' | 'vk' | 'github') => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => Promise<void>
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  // Load user on mount
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const userData = await authAPI.me()
          setUser(userData)
        } catch (error) {
          console.error('Failed to load user:', error)
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setIsLoading(false)
    }
    loadUser()
  }, [token])

  const login = async (email: string, password: string, twoFactorToken?: string) => {
    const response = await authAPI.login({ email, password, twoFactorToken })
    
    // Check if 2FA is required
    if (response.requiresTwoFactor) {
      return { requiresTwoFactor: true }
    }
    
    // Login successful
    if (response.token && response.user) {
      localStorage.setItem('token', response.token)
      setToken(response.token)
      setUser(response.user)
      return { success: true, user: response.user }
    }
    
    throw new Error('Неверный ответ от сервера')
  }

  const register = async (email: string, password: string, name: string) => {
    const response = await authAPI.register({ email, password, name })
    localStorage.setItem('token', response.token)
    setToken(response.token)
    setUser(response.user)
  }

  const loginWithOAuth = async (provider: 'google' | 'vk' | 'github') => {
    try {
      const { url } = await authAPI.getOAuthUrl(provider)
      window.location.href = url
    } catch (error) {
      console.error('OAuth login error:', error)
      throw error
    }
  }

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Clear all cookies
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim()
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
    })
    
    // Clear state
    setToken(null)
    setUser(null)
    
    // Redirect to home
    window.location.href = '/'
  }

  const updateUser = async (data: Partial<User>) => {
    const updatedUser = await authAPI.updateProfile(data)
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithOAuth,
        logout,
        updateUser,
        setUser,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext

