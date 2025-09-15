"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  emit: (event: string, data?: any) => void
  on: (event: string, callback: (...args: any[]) => void) => void
  off: (event: string, callback?: (...args: any[]) => void) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, token } = useAuth()

  useEffect(() => {
    if (user && token) {
      console.log('Initializing Socket.io connection with token:', token.substring(0, 20) + '...')
      const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5
      })

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id)
        setIsConnected(true)
      })

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason)
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error)
        console.error('❌ Error details:', {
          message: error.message,
          description: error.description,
          context: error.context,
          type: error.type
        })
        setIsConnected(false)
      })

      newSocket.on('error', (error) => {
        console.error('❌ Socket error:', error)
      })

      setSocket(newSocket)

      return () => {
        console.log('Closing socket connection')
        newSocket.close()
      }
    } else {
      console.log('No user or token, not connecting socket')
    }
  }, [user, token])

  const emit = (event: string, data?: any) => {
    if (socket && isConnected) {
      console.log('📤 Emitting event:', event, data)
      socket.emit(event, data)
    } else {
      console.log('❌ Cannot emit - socket not connected:', { socket: !!socket, isConnected })
    }
  }

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      console.log('👂 Listening for event:', event)
      socket.on(event, callback)
    } else {
      console.log('❌ Cannot listen - no socket')
    }
  }

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socket) {
      console.log('🔇 Removing listener for event:', event)
      socket.off(event, callback)
    }
  }

  const value: SocketContextType = {
    socket,
    isConnected,
    emit,
    on,
    off
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
