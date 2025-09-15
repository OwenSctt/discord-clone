"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useNotifications } from "@/contexts/NotificationContext"
import { Bell, Check, X, MessageCircle, UserPlus, Server, AtSign, Heart } from "lucide-react"

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || !notification.read
  )

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageCircle size={16} />
      case 'friend_request': return <UserPlus size={16} />
      case 'server_invite': return <Server size={16} />
      case 'mention': return <AtSign size={16} />
      case 'reaction': return <Heart size={16} />
      default: return <Bell size={16} />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message': return 'text-blue-400'
      case 'friend_request': return 'text-green-400'
      case 'server_invite': return 'text-purple-400'
      case 'mention': return 'text-yellow-400'
      case 'reaction': return 'text-pink-400'
      default: return 'text-gray-400'
    }
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#36393f] border-[#4f545c] text-white max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center">
                <Bell size={20} className="mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-[#b9bbbe]">
                Stay updated with your latest activity
              </DialogDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                className="text-[#b9bbbe] hover:text-white"
              >
                {filter === 'all' ? 'Unread Only' : 'All'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-[#b9bbbe] hover:text-white"
              >
                Mark All Read
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="text-center text-[#b9bbbe] py-8">
              {filter === 'all' ? 'No notifications yet' : 'No unread notifications'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    notification.read 
                      ? 'bg-[#2f3136] border-[#4f545c]' 
                      : 'bg-[#393c43] border-[#5865f2]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`mt-1 ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-white font-medium text-sm">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-[#b9bbbe] text-sm mt-1">
                          {notification.message}
                        </p>
                        <p className="text-[#8e9297] text-xs mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="text-[#b9bbbe] hover:text-white p-1"
                        >
                          <Check size={14} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearNotification(notification.id)}
                        className="text-[#b9bbbe] hover:text-red-400 p-1"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
