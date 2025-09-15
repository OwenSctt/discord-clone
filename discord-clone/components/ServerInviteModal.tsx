"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/AuthContext"
import { useServer } from "@/contexts/ServerContext"
import { toast } from "sonner"
import axios from "axios"
import { Copy, UserPlus, Users } from "lucide-react"

interface Friend {
  _id: string
  username: string
  displayName: string
  avatar?: string
  status: string
}

interface ServerInviteModalProps {
  isOpen: boolean
  onClose: () => void
  serverId?: string
}

export function ServerInviteModal({ isOpen, onClose, serverId }: ServerInviteModalProps) {
  const { token } = useAuth()
  const { currentServer } = useServer()
  const [friends, setFriends] = useState<Friend[]>([])
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const server = serverId ? { _id: serverId } : currentServer

  useEffect(() => {
    if (isOpen && server?._id) {
      fetchFriends()
      fetchInviteCode()
    }
  }, [isOpen, server?._id])

  const fetchFriends = async () => {
    if (!token) return
    
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFriends(response.data.friends || [])
    } catch (error) {
      console.error("Failed to fetch friends:", error)
    }
  }

  const fetchInviteCode = async () => {
    if (!token || !server?._id) return
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/servers/${server._id}/invite`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setInviteCode(response.data.inviteCode)
    } catch (error) {
      console.error("Failed to fetch invite code:", error)
    }
  }

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/invite/${inviteCode}`
    navigator.clipboard.writeText(inviteLink)
    toast.success("Invite link copied to clipboard!", {
      description: "Share this link with friends to invite them to your server",
      duration: 4000,
    })
  }

  const inviteFriend = async (friendId: string) => {
    if (!token || !server?._id) return
    
    try {
      const friend = friends.find(f => f._id === friendId)
      const inviteLink = `${window.location.origin}/invite/${inviteCode}`
      navigator.clipboard.writeText(inviteLink)
      toast.success(`Invite link copied! Send it to ${friend?.displayName || friend?.username}`, {
        description: "The invite link has been copied to your clipboard",
        duration: 4000,
      })
    } catch (error) {
      toast.error("Failed to copy invite link")
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#36393f] border-[#4f545c] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Users size={20} />
            Invite Friends to {server?.name || "Server"}
          </DialogTitle>
          <DialogDescription className="text-[#b9bbbe]">
            Invite your friends to join this server
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invite Link Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#b9bbbe]">Server Invite Link</label>
            <div className="flex gap-2">
              <Input
                value={inviteCode ? `${window.location.origin}/invite/${inviteCode}` : "Generating..."}
                readOnly
                className="bg-[#40444b] border-[#4f545c] text-white"
              />
              <Button
                onClick={copyInviteLink}
                disabled={!inviteCode}
                className="bg-[#5865f2] hover:bg-[#4752c4]"
              >
                <Copy size={16} />
              </Button>
            </div>
          </div>

          {/* Friends List */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#b9bbbe]">Your Friends</label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {friends.length === 0 ? (
                <div className="text-center text-[#8e9297] py-4">
                  No friends to invite
                </div>
              ) : (
                friends.map((friend) => (
                  <div key={friend._id} className="flex items-center justify-between p-2 hover:bg-[#393c43] rounded">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={friend.avatar || ""} />
                          <AvatarFallback className="bg-[#5865f2] text-white text-xs">
                            {friend.displayName?.charAt(0) || friend.username?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#36393f] ${getStatusColor(friend.status)}`} />
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{friend.displayName || friend.username}</div>
                        <div className="text-[#b9bbbe] text-xs">#{friend.username}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => inviteFriend(friend._id)}
                      className="bg-[#5865f2] hover:bg-[#4752c4] text-xs"
                    >
                      <UserPlus size={14} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
