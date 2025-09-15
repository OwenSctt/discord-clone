"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMessages } from "@/hooks/useMessages"
import { useAuth } from "@/contexts/AuthContext"
import { FileUpload } from "./FileUpload"
import {
  Hash,
  Bell,
  Pin,
  Users,
  Search,
  Inbox,
  MessageCircle as QuestionMarkCircle,
  MessageCircle,
  Plus,
  Gift,
  Sticker,
  Smile,
  Send,
  Paperclip,
  Image,
  Video,
} from "lucide-react"

interface ChatAreaProps {
  channelName: string
  channelId?: string
  currentServer?: any
}

export function ChatArea({ channelName, channelId, currentServer }: ChatAreaProps) {
  const [message, setMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const { user } = useAuth()
  const { 
    messages, 
    loading, 
    error, 
    isTyping: typingUsers, 
    sendMessage, 
    sendTyping,
    editMessage,
    deleteMessage,
    addReaction
  } = useMessages({ channelId })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && user) {
      try {
        await sendMessage(message.trim())
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
      sendTyping()
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#36393f]">
      {/* Channel Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#202225] shadow-sm">
        <div className="flex items-center">
          <Hash size={20} className="text-[#8e9297] mr-2" />
          <span className="text-white font-semibold">{channelName}</span>
          <div className="w-px h-6 bg-[#4f545c] mx-2"></div>
          <span className="text-[#8e9297] text-sm">Channel topic or description goes here</span>
        </div>
        <div className="flex items-center space-x-4">
          <Bell size={20} className="text-[#b9bbbe] hover:text-white cursor-pointer" />
          <Pin size={20} className="text-[#b9bbbe] hover:text-white cursor-pointer" />
          <Users size={20} className="text-[#b9bbbe] hover:text-white cursor-pointer" />
          <div className="relative">
            <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#8e9297]" />
            <Input
              placeholder="Search"
              className="w-36 h-6 pl-8 bg-[#202225] border-none text-white placeholder-[#8e9297] text-sm"
            />
          </div>
          <Inbox size={20} className="text-[#b9bbbe] hover:text-white cursor-pointer" />
          <QuestionMarkCircle size={20} className="text-[#b9bbbe] hover:text-white cursor-pointer" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!channelId ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-[#8e9297] text-center">
              <div className="text-2xl mb-2">👋</div>
              <div>Select a channel to start chatting!</div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-[#8e9297] text-sm">Loading...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-red-400">Error loading messages: {error}</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-[#8e9297]">No messages yet. Start the conversation!</div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className="flex items-start space-x-4 hover:bg-[#32353b] p-2 rounded group relative">
              <Avatar className="w-10 h-10 mt-0.5">
                <AvatarImage src={msg.author.avatar || ""} />
                <AvatarFallback className="bg-[#5865f2] text-white">
                  {msg.author.displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className="text-white font-medium hover:underline cursor-pointer">
                    {msg.author.displayName}
                  </span>
                  <span className="text-[#8e9297] text-xs">#{msg.author.username}</span>
                  <span className="text-[#8e9297] text-xs">{formatTimestamp(msg.createdAt)}</span>
                </div>
                <div className="text-[#dcddde] text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {msg.attachments.map((attachment, index) => (
                      <div key={index} className="max-w-md">
                        {attachment.type.startsWith('image/') ? (
                          <img 
                            src={attachment.url} 
                            alt={attachment.filename}
                            className="rounded-lg max-w-full h-auto"
                          />
                        ) : (
                          <a 
                            href={attachment.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[#00aff4] hover:underline"
                          >
                            📎 {attachment.filename}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
              
              {/* Message Actions - Show on hover */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#36393f] rounded-lg border border-[#4f545c] shadow-lg flex">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]"
                  onClick={() => addReaction?.(msg._id, '👍')}
                  title="Add Reaction"
                >
                  <Smile size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]"
                  onClick={() => {
                    // Set reply mode - for now just log, can be enhanced later
                    console.log('Reply to message:', msg._id)
                  }}
                  title="Reply"
                >
                  <MessageCircle size={16} />
                </Button>
                {msg.author._id === user?._id && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]"
                      onClick={() => {
                        const newContent = prompt('Edit message:', msg.content);
                        if (newContent && newContent !== msg.content) {
                          editMessage?.(msg._id, newContent);
                        }
                      }}
                      title="Edit"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-[#b9bbbe] hover:text-red-400 hover:bg-[#4f545c]"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this message?')) {
                          deleteMessage?.(msg._id);
                        }
                      }}
                      title="Delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-[#8e9297] text-sm italic">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-[#8e9297] rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-[#8e9297] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-[#8e9297] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {typingUsers.length === 1 
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.join(', ')} are typing...`
              }
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {currentServer && (
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
              placeholder={`Message #${channelName}`}
              className="flex-1 bg-transparent border-none text-white placeholder-[#8e9297] focus:ring-0 h-11"
              disabled={loading}
            />
            <div className="flex items-center pr-3 space-x-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="w-6 h-6 text-[#b9bbbe] hover:text-white"
                onClick={() => setShowFileUpload(true)}
              >
                <Paperclip size={20} />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="w-6 h-6 text-[#b9bbbe] hover:text-white">
                <Gift size={20} />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="w-6 h-6 text-[#b9bbbe] hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" />
                </svg>
              </Button>
              <Button type="button" variant="ghost" size="icon" className="w-6 h-6 text-[#b9bbbe] hover:text-white">
                <Sticker size={20} />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="w-6 h-6 text-[#b9bbbe] hover:text-white">
                <Smile size={20} />
              </Button>
              {message.trim() && (
                <Button 
                  type="submit" 
                  size="icon" 
                  className="w-6 h-6 bg-[#5865f2] hover:bg-[#4752c4] text-white"
                  disabled={loading}
                >
                  <Send size={16} />
                </Button>
              )}
            </div>
          </div>
        </form>
        </div>
      )}

      {/* File Upload Modal */}
      <FileUpload
        isOpen={showFileUpload}
        onClose={() => setShowFileUpload(false)}
        onUploadComplete={(fileUrl, fileName, fileType) => {
          // Handle file upload completion
          console.log('File uploaded:', { fileUrl, fileName, fileType })
          setShowFileUpload(false)
        }}
        channelId={channelId}
      />
    </div>
  )
}
