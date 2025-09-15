"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useServer } from "@/contexts/ServerContext"
import { useAuth } from "@/contexts/AuthContext"
import axios from "axios"

interface User {
  _id: string
  username: string
  displayName: string
  avatar?: string
  status: "online" | "idle" | "dnd" | "offline"
  activity?: string
}

export function UserList() {
  const { currentServer } = useServer()
  const { user: currentUser, token } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const fetchServerMembers = async () => {
    if (!currentServer?._id || !token) {
      console.log('⚠️ Cannot fetch server members - missing server ID or token')
      return
    }
    
    console.log('🔍 Fetching server members with token:', token ? token.substring(0, 20) + '...' : 'null')
    console.log('🔍 Server ID:', currentServer._id)
    
    setLoading(true)
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/servers/${currentServer._id}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('✅ Server members fetched successfully:', response.data)
      
      // Ensure we have a valid members array
      const members = response.data?.members || response.data?.data || []
      if (Array.isArray(members)) {
        setUsers(members)
      } else {
        console.warn('⚠️ Members data is not an array:', members)
        setUsers([])
      }
    } catch (error) {
      console.error("❌ Failed to fetch server members:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServerMembers()
  }, [currentServer?._id, token])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-[#3ba55c]"
      case "idle":
        return "bg-[#faa61a]"
      case "dnd":
        return "bg-[#f23f42]"
      case "offline":
        return "bg-[#747f8d]"
      default:
        return "bg-[#747f8d]"
    }
  }

  // Ensure users is always an array and each user has required properties
  const safeUsers = Array.isArray(users) ? users.filter(user => user && typeof user === 'object') : []
  const onlineUsers = safeUsers.filter((user) => user.status !== "offline")
  const offlineUsers = safeUsers.filter((user) => user.status === "offline")

  if (loading) {
    return (
      <div className="w-60 bg-[#2f3136] p-4">
        <div className="text-[#8e9297] text-sm">Loading members...</div>
      </div>
    )
  }

  return (
    <div className="w-60 bg-[#2f3136] p-4">
      {/* Online Users */}
      <div className="mb-6">
        <h3 className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-2">
          Online — {onlineUsers.length}
        </h3>
        <div className="space-y-2">
          {onlineUsers.map((user) => (
            <div
              key={user._id}
              className="flex items-center space-x-3 p-2 rounded hover:bg-[#393c43] cursor-pointer group"
            >
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-[#5865f2] text-white text-sm">
                    {user.displayName?.charAt(0) || user.username?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-[#2f3136]`}
                ></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[#dcddde] text-sm font-medium truncate group-hover:text-white">
                  {user.displayName || user.username || 'Unknown User'}
                </div>
                {user.activity && <div className="text-[#8e9297] text-xs truncate">{user.activity}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Offline Users */}
      {offlineUsers.length > 0 && (
        <div>
          <h3 className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-2">
            Offline — {offlineUsers.length}
          </h3>
          <div className="space-y-2">
            {offlineUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center space-x-3 p-2 rounded hover:bg-[#393c43] cursor-pointer group"
              >
                <div className="relative">
                  <Avatar className="w-8 h-8 opacity-50">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-[#5865f2] text-white text-sm">
                      {user.displayName?.charAt(0) || user.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-[#2f3136]`}
                  ></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#8e9297] text-sm font-medium truncate group-hover:text-[#dcddde]">
                    {user.displayName || user.username || 'Unknown User'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
