"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

interface Server {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  owner: string;
  members: string[];
  channels: string[];
  createdAt: string;
  updatedAt: string;
}

interface Channel {
  _id: string;
  name: string;
  type: 'text' | 'voice' | 'category';
  server: string;
  position: number;
  permissions?: any;
  createdAt: string;
}

interface ServerContextType {
  servers: Server[];
  currentServer: Server | null;
  channels: Channel[];
  currentChannel: Channel | null;
  loading: boolean;
  error: string | null;
  createServer: (name: string, description?: string) => Promise<void>;
  joinServer: (inviteCode: string) => Promise<void>;
  leaveServer: (serverId: string) => Promise<void>;
  createChannel: (name: string, type: 'text' | 'voice' | 'category', serverId: string) => Promise<void>;
  deleteChannel: (channelId: string) => Promise<void>;
  setCurrentServer: (server: Server | null) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  refreshServers: () => Promise<void>;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export function ServerProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [currentServer, setCurrentServer] = useState<Server | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = async () => {
    if (!user || !token) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/servers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setServers(response.data.servers);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch servers');
      console.error('Error fetching servers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async (serverId: string) => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/channels/server/${serverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChannels(response.data.channels);
    } catch (err: any) {
      console.error('Error fetching channels:', err);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchServers();
    }
  }, [user, token]);

  useEffect(() => {
    if (currentServer) {
      fetchChannels(currentServer._id);
    }
  }, [currentServer, token]);

  // Auto-select first channel when channels are loaded
  useEffect(() => {
    if (channels.length > 0 && !currentChannel) {
      setCurrentChannel(channels[0]);
    }
  }, [channels, currentChannel]);

  const createServer = async (name: string, description?: string) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/servers`, 
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newServer = response.data.server;
      // Ensure the server has _id field for consistency
      if (newServer.id && !newServer._id) {
        newServer._id = newServer.id;
      }
      setServers(prev => [...prev, newServer]);
      setCurrentServer(newServer);
      
      // Create default channels
      await createChannel('general', 'text', newServer._id || newServer.id);
      await createChannel('voice', 'voice', newServer._id || newServer.id);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create server');
    }
  };

  const joinServer = async (inviteCode: string) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      console.log('Joining server with invite code:', inviteCode)
      console.log('API URL:', `${process.env.NEXT_PUBLIC_API_URL}/servers/join/${inviteCode}`)
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/servers/join/${inviteCode}`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Server join response:', response.data)
      const server = response.data.server;
      setServers(prev => [...prev, server]);
    } catch (err: any) {
      console.error('Server join error details:', err.response?.data || err.message)
      throw new Error(err.response?.data?.message || 'Failed to join server');
    }
  };

  const leaveServer = async (serverId: string) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/servers/${serverId}/leave`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setServers(prev => prev.filter(s => s._id !== serverId));
      if (currentServer?._id === serverId) {
        setCurrentServer(null);
        setChannels([]);
        setCurrentChannel(null);
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to leave server');
    }
  };

  const createChannel = async (name: string, type: 'text' | 'voice' | 'category', serverId: string) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/channels`, 
        { name, type, serverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newChannel = response.data.channel;
      setChannels(prev => [...prev, newChannel]);
      
      if (currentServer?._id === serverId) {
        setCurrentChannel(newChannel);
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to create channel');
    }
  };

  const deleteChannel = async (channelId: string) => {
    if (!token) throw new Error('Not authenticated');
    
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/channels/${channelId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setChannels(prev => prev.filter(c => c._id !== channelId));
      if (currentChannel?._id === channelId) {
        setCurrentChannel(null);
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete channel');
    }
  };

  const refreshServers = async () => {
    await fetchServers();
  };

  return (
    <ServerContext.Provider value={{
      servers,
      currentServer,
      channels,
      currentChannel,
      loading,
      error,
      createServer,
      joinServer,
      leaveServer,
      createChannel,
      deleteChannel,
      setCurrentServer,
      setCurrentChannel,
      refreshServers
    }}>
      {children}
    </ServerContext.Provider>
  );
}

export function useServer() {
  const context = useContext(ServerContext);
  if (context === undefined) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
}
