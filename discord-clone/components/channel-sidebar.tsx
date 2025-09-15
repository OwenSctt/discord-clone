"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Hash, Volume2, Settings, ChevronDown, Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useServer } from "@/contexts/ServerContext"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { ChannelCreationModal } from "./ChannelCreationModal"
import { NotificationPanel } from "./NotificationPanel"

interface ChannelSidebarProps {
  selectedChannel: string
  onChannelSelect: (channel: string) => void
  serverName: string
  onSettingsClick?: () => void
}

export function ChannelSidebar({ selectedChannel, onChannelSelect, serverName, onSettingsClick }: ChannelSidebarProps) {
  const { currentServer, channels, createChannel } = useServer()
  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const textChannels = channels.filter(channel => channel.type === 'text')
  const voiceChannels = channels.filter(channel => channel.type === 'voice')

  return (
    <div className="w-60 bg-[#2f3136] flex flex-col">
      {/* Server Header */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#202225] shadow-sm">
        <h1 className="text-white font-semibold text-sm truncate">{currentServer?.name || serverName}</h1>
        <ChevronDown size={18} className="text-[#b9bbbe]" />
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Text Channels */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <div className="flex items-center">
              <ChevronDown size={12} className="text-[#8e9297] mr-1" />
              <span className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide">Text Channels</span>
            </div>
            <Plus 
              size={18} 
              className="text-[#8e9297] hover:text-[#dcddde] cursor-pointer" 
              onClick={() => setShowCreateChannelModal(true)}
            />
          </div>
          {textChannels.map((channel) => (
            <Button
              key={channel._id}
              variant="ghost"
              className={`w-full justify-start px-2 py-1 h-8 mb-0.5 rounded text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43] ${
                selectedChannel === channel._id ? "bg-[#393c43] text-[#dcddde]" : ""
              }`}
              onClick={() => onChannelSelect(channel._id)}
            >
              <Hash size={16} className="mr-2" />
              <span className="text-sm">{channel.name}</span>
            </Button>
          ))}
        </div>

        {/* Voice Channels */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <div className="flex items-center">
              <ChevronDown size={12} className="text-[#8e9297] mr-1" />
              <span className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide">Voice Channels</span>
            </div>
            <Plus 
              size={18} 
              className="text-[#8e9297] hover:text-[#dcddde] cursor-pointer" 
              onClick={() => setShowCreateChannelModal(true)}
            />
          </div>
          {voiceChannels.map((channel) => (
            <div key={channel._id} className="mb-0.5">
              <Button
                variant="ghost"
                className={`w-full justify-start px-2 py-1 h-8 rounded text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43] ${
                  selectedChannel === channel._id ? "bg-[#393c43] text-[#dcddde]" : ""
                }`}
                onClick={() => onChannelSelect(channel._id)}
              >
                <Volume2 size={16} className="mr-2" />
                <span className="text-sm">{channel.name}</span>
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* User Panel */}
      <div className="h-14 bg-[#292b2f] px-2 flex items-center">
        <Avatar className="w-8 h-8 mr-2">
          <AvatarImage src="/diverse-user-avatars.png" />
          <AvatarFallback className="bg-[#5865f2] text-white text-sm">U</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium truncate">{user?.displayName || user?.username}</div>
          <div className="text-[#b9bbbe] text-xs truncate">#{user?.username}</div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 text-[#b9bbbe] hover:text-white hover:bg-[#393c43] relative"
            onClick={() => setShowNotifications(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,15C12.81,15 13.5,14.7 14.11,14.11C14.7,13.5 15,12.81 15,12C15,11.19 14.7,10.5 14.11,9.89C13.5,9.3 12.81,9 12,9C11.19,9 10.5,9.3 9.89,9.89C9.3,10.5 9,11.19 9,12C9,12.81 9.3,13.5 9.89,14.11C10.5,14.7 11.19,15 12,15M12,2C14.21,2 16.21,2.81 17.78,4.39C19.36,5.96 20.17,7.96 20.17,10.17C20.17,12.38 19.36,14.38 17.78,15.95C16.21,17.53 14.21,18.34 12,18.34C9.79,18.34 7.79,17.53 6.22,15.95C4.64,14.38 3.83,12.38 3.83,10.17C3.83,7.96 4.64,5.96 6.22,4.39C7.79,2.81 9.79,2 12,2M12,20.18L17.83,14.35C19.2,12.98 19.88,11.17 19.88,10.17C19.88,8.17 19.17,6.67 17.83,5.33C16.5,4 15,3.29 12,3.29C9,3.29 7.5,4 6.17,5.33C4.83,6.67 4.12,8.17 4.12,10.17C4.12,11.17 4.8,12.98 6.17,14.35L12,20.18Z" />
            </svg>
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{unreadCount}</span>
              </div>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-[#b9bbbe] hover:text-white hover:bg-[#393c43]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-[#b9bbbe] hover:text-white hover:bg-[#393c43]"
            onClick={onSettingsClick}
          >
            <Settings size={20} />
          </Button>
        </div>
      </div>

      {/* Channel Creation Modal */}
      <ChannelCreationModal 
        isOpen={showCreateChannelModal} 
        onClose={() => setShowCreateChannelModal(false)} 
        serverId={currentServer?._id}
      />
      
      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </div>
  )
}
