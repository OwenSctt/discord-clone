"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'message' | 'friend_request' | 'server_invite' | 'mention' | 'reaction';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { socket } = useSocket();
  const { user } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (socket && user) {
      // Listen for new messages
      const handleNewMessage = (data: any) => {
        if (data.channelId && data.author._id !== user.id) {
          addNotification({
            type: 'message',
            title: 'New Message',
            message: `${data.author.displayName} sent a message in #${data.channelName || 'channel'}`,
            data: { channelId: data.channelId, messageId: data._id }
          });
        }
      };

      // Listen for friend requests
      const handleFriendRequest = (data: any) => {
        addNotification({
          type: 'friend_request',
          title: 'Friend Request',
          message: `${data.from.displayName} sent you a friend request`,
          data: { requestId: data._id, from: data.from }
        });
      };

      // Listen for server invites
      const handleServerInvite = (data: any) => {
        addNotification({
          type: 'server_invite',
          title: 'Server Invite',
          message: `You've been invited to join ${data.serverName}`,
          data: { serverId: data.serverId, inviteCode: data.inviteCode }
        });
      };

      // Listen for mentions
      const handleMention = (data: any) => {
        addNotification({
          type: 'mention',
          title: 'You were mentioned',
          message: `${data.author.displayName} mentioned you in #${data.channelName}`,
          data: { channelId: data.channelId, messageId: data.messageId }
        });
      };

      socket.on('message-received', handleNewMessage);
      socket.on('friend-request-received', handleFriendRequest);
      socket.on('server-invite-received', handleServerInvite);
      socket.on('mention-received', handleMention);

      return () => {
        socket.off('message-received', handleNewMessage);
        socket.off('friend-request-received', handleFriendRequest);
        socket.off('server-invite-received', handleServerInvite);
        socket.off('mention-received', handleMention);
      };
    }
  }, [socket, user]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast notification
    switch (notification.type) {
      case 'message':
        toast.info(notification.message);
        break;
      case 'friend_request':
        toast.success(notification.message);
        break;
      case 'server_invite':
        toast.info(notification.message);
        break;
      case 'mention':
        toast.warning(notification.message);
        break;
      default:
        toast.info(notification.message);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
