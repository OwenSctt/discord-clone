"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  _id: string
  content: string
  author: {
    _id: string
    username: string
    displayName: string
    avatar?: string
  }
  channel: string
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

interface UseMessagesProps {
  channelId: string
}

export const useMessages = ({ channelId }: UseMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState<string[]>([])
  
  const { socket, isConnected, emit, on, off } = useSocket()
  const { token } = useAuth()

  // Fetch messages from API
  const fetchMessages = useCallback(async (isInitialLoad = false) => {
    if (!channelId || !token) return

    try {
      if (isInitialLoad) {
        setLoading(true)
      }
      setError(null)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${channelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessages(data.messages || [])
        } else {
          throw new Error(data.error?.message || 'Failed to fetch messages')
        }
      } else {
        throw new Error('Failed to fetch messages')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }, [channelId, token])

  // Send a new message
  const sendMessage = useCallback(async (content: string, replyTo?: string) => {
    if (!channelId || !token || !content.trim()) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${channelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, replyTo })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📨 Message send response:', data)
        if (data.success) {
          // Message will be added via socket event
          console.log('✅ Message sent successfully, data:', data.data)
          return data.data
        } else {
          console.error('❌ Message send failed - success false:', data)
          throw new Error(data.error?.message || 'Failed to send message')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Message send error:', response.status, errorData)
        throw new Error(errorData.message || `Failed to send message (${response.status})`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      throw err
    }
  }, [channelId, token])

  // Edit a message
  const editMessage = useCallback(async (messageId: string, content: string) => {
    if (!token || !content.trim()) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.message
        } else {
          throw new Error(data.error?.message || 'Failed to edit message')
        }
      } else {
        throw new Error('Failed to edit message')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit message')
      throw err
    }
  }, [token])

  // Delete a message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!token) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return true
        } else {
          throw new Error(data.error?.message || 'Failed to delete message')
        }
      } else {
        throw new Error('Failed to delete message')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message')
      throw err
    }
  }, [token])

  // Add reaction to message
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!token) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emoji })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.message
        } else {
          throw new Error(data.error?.message || 'Failed to add reaction')
        }
      } else {
        throw new Error('Failed to add reaction')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add reaction')
      throw err
    }
  }, [token])

  // Remove reaction from message
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!token) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages/${messageId}/reactions`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emoji })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return data.message
        } else {
          throw new Error(data.error?.message || 'Failed to remove reaction')
        }
      } else {
        throw new Error('Failed to remove reaction')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove reaction')
      throw err
    }
  }, [token])

  // Send typing indicator
  const sendTyping = useCallback(() => {
    if (isConnected && channelId) {
      emit('typing', { channelId })
    }
  }, [isConnected, channelId, emit])

  // Set up socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNewMessage = (message: Message) => {
      console.log('📨 Received message via socket:', message)
      console.log('📍 Current channelId:', channelId)
      console.log('📍 Message channel:', message.channel)
      console.log('🔍 Channel match:', message.channel === channelId)
      if (message.channel === channelId) {
        console.log('✅ Adding message to state')
        setMessages(prev => [...prev, message])
      } else {
        console.log('❌ Message not for current channel, ignoring')
      }
    }

    const handleMessageUpdate = (message: Message) => {
      setMessages(prev => 
        prev.map(msg => msg._id === message._id ? message : msg)
      )
    }

    const handleMessageDelete = (messageId: string) => {
      setMessages(prev => prev.filter(msg => msg._id !== messageId))
    }

    const handleTyping = (data: { channelId: string; user: { _id: string; username: string } }) => {
      if (data.channelId === channelId) {
        setIsTyping(prev => [...prev, data.user.username])
        
        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setIsTyping(prev => prev.filter(user => user !== data.user.username))
        }, 3000)
      }
    }

    const handleStopTyping = (data: { channelId: string; user: { _id: string; username: string } }) => {
      if (data.channelId === channelId) {
        setIsTyping(prev => prev.filter(user => user !== data.user.username))
      }
    }

    // Register event listeners
    on('message-received', handleNewMessage)
    on('messageUpdate', handleMessageUpdate)
    on('messageDelete', handleMessageDelete)
    on('user-typing', handleTyping)
    on('user-stopped-typing', handleStopTyping)

    // Cleanup
    return () => {
      off('message-received', handleNewMessage)
      off('messageUpdate', handleMessageUpdate)
      off('messageDelete', handleMessageDelete)
      off('user-typing', handleTyping)
      off('user-stopped-typing', handleStopTyping)
    }
  }, [socket, isConnected, channelId, on, off])

  // Join channel room and fetch messages when channel changes
  useEffect(() => {
    if (channelId && isConnected) {
      console.log('Joining channel:', channelId)
      emit('join-channel', channelId)
      fetchMessages(true) // Initial load
    }
  }, [channelId, isConnected, emit, fetchMessages])

  return {
    messages,
    loading,
    error,
    isTyping: Array.from(isTyping),
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    sendTyping,
    refetch: fetchMessages
  }
}
