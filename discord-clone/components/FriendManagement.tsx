"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import axios from "axios"
import { UserPlus, UserMinus, Search, Check, X } from "lucide-react"

interface User {
  _id: string
  username: string
  displayName: string
  avatar?: string
  status: string
}

interface FriendRequest {
  _id: string
  from: User
  to: User
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
}

interface FriendManagementProps {
  isOpen: boolean
  onClose: () => void
}

export function FriendManagement({ isOpen, onClose }: FriendManagementProps) {
  const { user, token } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [friends, setFriends] = useState<User[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const searchUsers = async () => {
    if (!searchQuery.trim() || !token) return
    
    setIsSearching(true)
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/search`, {
        params: { q: searchQuery },
        headers: { Authorization: `Bearer ${token}` }
      })
      setSearchResults(response.data.users)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to search users")
    } finally {
      setIsSearching(false)
    }
  }

  const fetchFriends = async () => {
    if (!token) return
    
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFriends(response.data.friends)
    } catch (error: any) {
      console.error("Failed to fetch friends:", error)
    }
  }

  const fetchFriendRequests = async () => {
    if (!token) return
    
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/friends/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFriendRequests(response.data.requests)
    } catch (error: any) {
      console.error("Failed to fetch friend requests:", error)
    }
  }

  const sendFriendRequest = async (userId: string) => {
    if (!token) return
    
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/friends/request`, 
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success("Friend request sent!")
      searchUsers() // Refresh search results
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send friend request")
    }
  }

  const respondToFriendRequest = async (requestId: string, action: 'accept' | 'decline') => {
    if (!token) return
    
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/friends/respond`, 
        { requestId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`Friend request ${action}ed!`)
      fetchFriendRequests()
      fetchFriends()
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} friend request`)
    }
  }

  const removeFriend = async (friendId: string) => {
    if (!token) return
    
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/friends/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Friend removed")
      fetchFriends()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to remove friend")
    }
  }

  useEffect(() => {
    if (isOpen && user) {
      // Clear previous data when user changes
      setFriends([])
      setFriendRequests([])
      setSearchResults([])
      
      fetchFriends()
      fetchFriendRequests()
    }
  }, [isOpen, token, user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'dnd': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#36393f] border-[#4f545c] text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Friends</DialogTitle>
          <DialogDescription className="text-[#b9bbbe]">
            Manage your friends and friend requests
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#2f3136]">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="add">Add Friend</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="space-y-4">
            <div className="max-h-96 overflow-y-auto">
              {friends.length === 0 ? (
                <div className="text-center text-[#b9bbbe] py-8">
                  No friends yet. Add some friends to get started!
                </div>
              ) : (
                friends.map((friend) => (
                  <div key={friend._id} className="flex items-center justify-between p-3 hover:bg-[#393c43] rounded">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback className="bg-[#5865f2] text-white">
                            {friend.displayName?.charAt(0) || friend.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#2f3136] ${getStatusColor(friend.status)}`}></div>
                      </div>
                      <div>
                        <div className="text-white font-medium">{friend.displayName}</div>
                        <div className="text-[#b9bbbe] text-sm">#{friend.username}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFriend(friend._id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <UserMinus size={16} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="add" className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Enter username or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#202225] border-[#4f545c] text-white placeholder-[#72767d]"
              />
              <Button 
                onClick={searchUsers} 
                disabled={isSearching || !searchQuery.trim()}
                className="bg-[#5865f2] hover:bg-[#4752c4]"
              >
                <Search size={16} />
              </Button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="text-center text-[#b9bbbe] py-8">
                  {searchQuery ? "No users found" : "Search for users to add as friends"}
                </div>
              ) : (
                searchResults.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 hover:bg-[#393c43] rounded">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-[#5865f2] text-white">
                            {user.displayName?.charAt(0) || user.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#2f3136] ${getStatusColor(user.status)}`}></div>
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.displayName}</div>
                        <div className="text-[#b9bbbe] text-sm">#{user.username}</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => sendFriendRequest(user._id)}
                      className="bg-[#5865f2] hover:bg-[#4752c4]"
                    >
                      <UserPlus size={16} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-4">
            <div className="max-h-96 overflow-y-auto">
              {friendRequests.length === 0 ? (
                <div className="text-center text-[#b9bbbe] py-8">
                  No pending friend requests
                </div>
              ) : (
                friendRequests.map((request) => (
                  <div key={request._id} className="flex items-center justify-between p-3 hover:bg-[#393c43] rounded">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={request.from?.avatar || ''} />
                        <AvatarFallback className="bg-[#5865f2] text-white">
                          {request.from?.displayName?.charAt(0) || request.from?.username?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-white font-medium">{request.from?.displayName || 'Unknown User'}</div>
                        <div className="text-[#b9bbbe] text-sm">#{request.from?.username || 'unknown'}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => respondToFriendRequest(request._id, 'accept')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check size={16} />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => respondToFriendRequest(request._id, 'decline')}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
