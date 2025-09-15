"use client"

import React from 'react'
import { useAuth } from '../contexts/AuthContext'

const AuthDebug: React.FC = () => {
  const { user, token, loading, clearInvalidToken, logout } = useAuth()

  const handleClearToken = () => {
    clearInvalidToken()
  }

  const handleLogout = () => {
    logout()
  }

  if (loading) {
    return <div className="p-4 bg-yellow-100 text-yellow-800">Loading authentication...</div>
  }

  return (
    <div className="p-4 bg-gray-100 text-gray-800 border-b">
      <h3 className="font-bold mb-2">🔍 Authentication Debug</h3>
      <div className="space-y-2 text-sm">
        <div>
          <strong>User:</strong> {user ? `${user.displayName} (${user.username})` : 'Not logged in'}
        </div>
        <div>
          <strong>Token:</strong> {token ? `${token.substring(0, 20)}...` : 'No token'}
        </div>
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        <div className="flex space-x-2 mt-2">
          <button
            onClick={handleClearToken}
            className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
          >
            Clear Invalid Token
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthDebug

