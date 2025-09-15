"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDM } from "@/contexts/DMContext"
import { useAuth } from "@/contexts/AuthContext"
import { Send, Smile, Paperclip, Image, Video, Plus } from "lucide-react"

interface DMChatAreaProps {
  dmUser: {
    _id: string
    username: string
    displayName: string
    avatar?: string
    status: string
  }
}

export function DMChatArea({ dmUser }: DMChatAreaProps) {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const { user } = useAuth()
  const { dmMessages, sendDMMessage, loading, error } = useDM()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [dmMessages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && user) {
      try {
        await sendDMMessage(message.trim(), dmUser._id)
        setMessage("")
      } catch (error) {
        console.error("Failed to send message:", error)
      }
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    
    if (!isTyping) {
      setIsTyping(true)
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
      }, 1000)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'busy': return 'bg-red-500'
      case 'invisible': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#36393f]">
      {/* DM Header */}
      <div className="h-12 bg-[#36393f] border-b border-[#40444b] flex items-center px-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="w-8 h-8">
              <AvatarImage src={dmUser.avatar || ""} />
              <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                {dmUser.displayName?.charAt(0) || dmUser.username?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#36393f] ${getStatusColor(dmUser.status)}`} />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">
              {dmUser.displayName || dmUser.username}
            </div>
            <div className="text-[#b9bbbe] text-xs">
              {dmUser.status === 'online' ? 'Online' : 
               dmUser.status === 'idle' ? 'Idle' :
               dmUser.status === 'busy' ? 'Busy' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-[#8e9297] text-sm">Loading messages...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-red-400">Error loading messages: {error}</div>
          </div>
        ) : dmMessages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-[#8e9297]">
              <div className="text-2xl mb-2">💬</div>
              <div>Start a conversation with {dmUser.displayName || dmUser.username}!</div>
            </div>
          </div>
        ) : (
          dmMessages && dmMessages.length > 0 ? dmMessages.map((msg) => (
            <div key={msg._id} className="flex items-start space-x-4 hover:bg-[#32353b] p-2 rounded group relative">
              <Avatar className="w-10 h-10 mt-0.5">
                <AvatarImage src={msg.author.avatar || ""} />
                <AvatarFallback className="bg-[#5865f2] text-white">
                  {(msg.author.displayName || msg.author.username || '?')
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className="text-white font-semibold text-sm">
                    {msg.author.displayName || msg.author.username}
                  </span>
                  <span className="text-[#8e9297] text-xs">
                    {new Date(msg.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className="text-[#dcddde] text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
                
                {/* Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="mt-2 flex space-x-2">
                    {msg.reactions.map((reaction, index) => (
                      <div 
                        key={index}
                        className="bg-[#4f545c] hover:bg-[#5a5f66] px-2 py-1 rounded-full text-xs cursor-pointer"
                      >
                        {reaction.emoji} {reaction.users.length}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-[#8e9297]">
                <div className="text-2xl mb-2">💬</div>
                <div>No messages yet. Start the conversation!</div>
              </div>
            </div>
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4">
        <form onSubmit={handleSendMessage} className="relative">
          <div className="bg-[#40444b] rounded-lg flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-11 h-11 text-[#b9bbbe] hover:text-white hover:bg-[#4f545c] rounded-l-lg"
              onClick={() => setShowFileUpload(true)}
              title="Upload File"
            >
              <Plus size={20} />
            </Button>
            <Input
              value={message}
              onChange={handleTyping}
              placeholder={`Message ${dmUser.displayName || dmUser.username}`}
              className="flex-1 bg-transparent border-0 text-white placeholder-[#8e9297] focus:ring-0 focus:border-0"
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-11 h-11 text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]"
              title="Emoji"
            >
              <Smile size={20} />
            </Button>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="w-11 h-11 text-[#b9bbbe] hover:text-white hover:bg-[#4f545c] rounded-r-lg"
              disabled={!message.trim() || loading}
              title="Send Message"
            >
              <Send size={20} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
