"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  username: string
  displayName: string
  email: string
  avatar?: string
  bio?: string
  status: 'online' | 'away' | 'busy' | 'invisible'
  lastSeen?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, displayName: string, email: string, password: string) => Promise<void>
  logout: () => void
  clearInvalidToken: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('discord_token')
    const storedUser = localStorage.getItem('discord_user')
    
    console.log('🔍 Checking stored token:', storedToken ? storedToken.substring(0, 20) + '...' : 'null')
    console.log('🔍 Token parts:', storedToken ? storedToken.split('.').length : 0)
    
    if (storedToken && storedUser) {
      // Basic token format validation
      if (storedToken.split('.').length === 3) {
        console.log('✅ Token format valid, setting token and user')
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        // Verify token is still valid
        verifyToken(storedToken)
      } else {
        console.log('❌ Invalid token format, clearing storage')
        localStorage.removeItem('discord_token')
        localStorage.removeItem('discord_user')
        setLoading(false)
      }
    } else {
      console.log('❌ No stored token or user found')
      setLoading(false)
    }
  }, [])

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Token is valid, get full user data
          await fetchUserData(tokenToVerify)
        } else {
          throw new Error('Invalid token')
        }
      } else {
        throw new Error('Token verification failed')
      }
    } catch (err) {
      console.error('Token verification error:', err)
      logout()
    }
  }

  const fetchUserData = async (tokenToUse: string) => {
    try {
      console.log('🔍 Fetching user data with token:', tokenToUse.substring(0, 20) + '...')
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('🔍 User data response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 User data response:', data)
        if (data.success) {
          console.log('✅ User data fetched successfully')
          setUser(data.user)
          localStorage.setItem('discord_user', JSON.stringify(data.user))
        } else {
          console.error('❌ User data fetch failed - success false:', data)
          throw new Error('Failed to fetch user data')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ User data fetch failed - status:', response.status, errorData)
        throw new Error('Failed to fetch user data')
      }
    } catch (err) {
      console.error('❌ Fetch user data error:', err)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('discord_token', data.token)
        localStorage.setItem('discord_user', JSON.stringify(data.user))
      } else {
        throw new Error(data.error?.message || 'Login failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const register = async (username: string, displayName: string, email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, displayName, email, password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('discord_token', data.token)
        localStorage.setItem('discord_user', JSON.stringify(data.user))
      } else {
        throw new Error(data.error?.message || 'Registration failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    console.log('🚪 Logging out user')
    setUser(null)
    setToken(null)
    setError(null)
    localStorage.removeItem('discord_token')
    localStorage.removeItem('discord_user')
  }

  const clearInvalidToken = () => {
    console.log('🧹 Clearing invalid token')
    localStorage.removeItem('discord_token')
    localStorage.removeItem('discord_user')
    setUser(null)
    setToken(null)
    setLoading(false)
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const responseData = await response.json()

      if (response.ok && responseData.success) {
        setUser(responseData.user)
        localStorage.setItem('discord_user', JSON.stringify(responseData.user))
      } else {
        throw new Error(responseData.error?.message || 'Profile update failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Password changed successfully
      } else {
        throw new Error(data.error?.message || 'Password change failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password change failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    clearInvalidToken,
    updateProfile,
    changePassword,
    loading,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
