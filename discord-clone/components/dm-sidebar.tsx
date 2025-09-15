"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDM } from "@/contexts/DMContext"
import { useAuth } from "@/contexts/AuthContext"
import { Search, UserPlus, MessageCircle } from "lucide-react"
import { FriendManagement } from "./FriendManagement"

interface DMSidebarProps {
  selectedDMUser: string
  onDMUserSelect: (userId: string) => void
}

export function DMSidebar({ selectedDMUser, onDMUserSelect }: DMSidebarProps) {
  const { dmUsers, currentDMUser, setCurrentDMUser } = useDM()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [showFriendManagement, setShowFriendManagement] = useState(false)

  const filteredUsers = dmUsers.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
    <div className="w-60 bg-[#2f3136] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#40444b]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Direct Messages</h2>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]"
            onClick={() => setShowFriendManagement(true)}
          >
            <UserPlus size={16} />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8e9297] w-4 h-4" />
          <Input
            placeholder="Find or start a conversation"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#40444b] border-[#4f545c] text-white placeholder-[#8e9297] focus:ring-2 focus:ring-[#5865f2]"
          />
        </div>
      </div>

      {/* DM Users List */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-[#8e9297]">
            {searchQuery ? "No users found" : "No friends to message"}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredUsers.map((dmUser) => (
              <div
                key={dmUser._id}
                className={`flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-[#393c43] ${
                  selectedDMUser === dmUser._id ? 'bg-[#393c43]' : ''
                }`}
                onClick={() => {
                  setCurrentDMUser(dmUser)
                  onDMUserSelect(dmUser._id)
                }}
              >
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={dmUser.avatar || ""} />
                    <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                      {dmUser.displayName?.charAt(0) || dmUser.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#2f3136] ${getStatusColor(dmUser.status)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {dmUser.displayName || dmUser.username}
                  </div>
                  <div className="text-[#b9bbbe] text-xs truncate">
                    {dmUser.status === 'online' ? 'Online' : 
                     dmUser.status === 'idle' ? 'Idle' :
                     dmUser.status === 'busy' ? 'Busy' : 'Offline'}
                  </div>
                </div>
                <MessageCircle className="w-4 h-4 text-[#8e9297]" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Friend Management Modal */}
      <FriendManagement 
        isOpen={showFriendManagement} 
        onClose={() => setShowFriendManagement(false)} 
      />
    </div>
  )
}

