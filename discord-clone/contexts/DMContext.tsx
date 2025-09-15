"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useSocket } from './SocketContext'
import axios from 'axios'

interface DMUser {
  _id: string
  username: string
  displayName: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'invisible'
  lastSeen?: string
}

interface DMMessage {
  _id: string
  content: string
  author: {
    _id: string
    username: string
    displayName: string
    avatar?: string
  }
  recipient: string
  createdAt: string
  updatedAt: string
  replyTo?: string
  attachments?: Array<{
    url: string
    filename: string
    size: number
    type: string
  }>
  reactions?: Array<{
    emoji: string
    users: string[]
  }>
}

interface DMContextType {
  dmUsers: DMUser[]
  currentDMUser: DMUser | null
  dmMessages: DMMessage[]
  setCurrentDMUser: (user: DMUser | null) => void
  sendDMMessage: (content: string, recipientId: string) => Promise<void>
  loading: boolean
  error: string | null
}

const DMContext = createContext<DMContextType | undefined>(undefined)

export function DMProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth()
  const { socket } = useSocket()
  const [dmUsers, setDMUsers] = useState<DMUser[]>([])
  const [currentDMUser, setCurrentDMUser] = useState<DMUser | null>(null)
  const [dmMessages, setDMMessages] = useState<DMMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch DM users (friends)
  const fetchDMUsers = async () => {
    if (!token) return
    
    try {
      setLoading(true)
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDMUsers(response.data.friends || [])
    } catch (err) {
      console.error('Failed to fetch DM users:', err)
      setError('Failed to fetch friends')
    } finally {
      setLoading(false)
    }
  }

  // Fetch DM messages
  const fetchDMMessages = async (recipientId: string) => {
    if (!token || !user) return
    
    try {
      setLoading(true)
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/messages/dm/${recipientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setDMMessages(Array.isArray(response.data.messages) ? response.data.messages : [])
    } catch (err) {
      console.error('Failed to fetch DM messages:', err)
      setError('Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }

  // Send DM message
  const sendDMMessage = async (content: string, recipientId: string) => {
    if (!token || !user) return
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/messages/dm`, {
        content,
        recipientId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success && response.data.data) {
        // Add message to local state
        setDMMessages(prev => [...prev, response.data.data])
      }
    } catch (err) {
      console.error('Failed to send DM:', err)
      throw new Error('Failed to send message')
    }
  }

  // Load DM users when component mounts
  useEffect(() => {
    if (user && token) {
      fetchDMUsers()
    }
  }, [user, token])

  // Load messages when DM user changes
  useEffect(() => {
    if (currentDMUser) {
      fetchDMMessages(currentDMUser._id)
    } else {
      setDMMessages([])
    }
  }, [currentDMUser])

  // Socket.io event listeners for real-time DM updates
  useEffect(() => {
    if (!socket) return

    const handleDMReceived = (message: DMMessage) => {
      console.log('DM received:', message)
      setDMMessages(prev => [...prev, message])
    }

    // Join user room for DM notifications
    if (user) {
      socket.emit('join-user', user._id)
    }

    // Listen for DM messages
    socket.on('dm-received', handleDMReceived)

    return () => {
      socket.off('dm-received', handleDMReceived)
    }
  }, [socket, user])

  return (
    <DMContext.Provider value={{
      dmUsers,
      currentDMUser,
      dmMessages,
      setCurrentDMUser,
      sendDMMessage,
      loading,
      error
    }}>
      {children}
    </DMContext.Provider>
  )
}

export function useDM() {
  const context = useContext(DMContext)
  if (context === undefined) {
    throw new Error('useDM must be used within a DMProvider')
  }
  return context
}
