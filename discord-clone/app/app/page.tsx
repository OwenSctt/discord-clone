"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useServer } from "@/contexts/ServerContext"
import { useDM } from "@/contexts/DMContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { NotificationPanel } from "@/components/NotificationPanel"
import { ServerSidebar } from "@/components/server-sidebar"
import { ChannelSidebar } from "@/components/channel-sidebar"
import { DMSidebar } from "@/components/dm-sidebar"
import { ChatArea } from "@/components/chat-area"
import { DMChatArea } from "@/components/dm-chat-area"
import { UserList } from "@/components/user-list"
import { SettingsModal } from "@/components/settings-modal"
import AuthDebug from "@/components/AuthDebug"

export default function DiscordApp() {
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedServer, setSelectedServer] = useState("")
  const [selectedChannel, setSelectedChannel] = useState("")
  const [selectedDMUser, setSelectedDMUser] = useState("")
  const { currentServer, currentChannel, setCurrentServer, setCurrentChannel, servers, channels } = useServer()
  const { currentDMUser, setCurrentDMUser } = useDM()
  const { unreadCount } = useNotifications()

  return (
    <ProtectedRoute>
      <AuthDebug />
      <div className="h-screen bg-[#36393f] flex overflow-hidden">
        {/* Server Sidebar */}
        <ServerSidebar 
          selectedServer={selectedServer} 
          onServerSelect={(serverId) => {
            if (serverId === "dm") {
              setSelectedServer("dm");
              setSelectedChannel("");
              setSelectedDMUser("");
              setCurrentServer(null);
              setCurrentChannel(null);
              setCurrentDMUser(null);
            } else {
              setSelectedServer(serverId);
              setSelectedChannel("");
              setSelectedDMUser("");
              const server = servers.find(s => s._id === serverId);
              setCurrentServer(server || null);
              setCurrentChannel(null);
              setCurrentDMUser(null);
            }
          }} 
        />

        {/* Channel/DM Sidebar */}
        {selectedServer === "dm" ? (
          <DMSidebar
            selectedDMUser={selectedDMUser}
            onDMUserSelect={(userId) => {
              setSelectedDMUser(userId);
              // The DM user will be set by the DMSidebar component
            }}
          />
        ) : (
          <ChannelSidebar
            selectedChannel={selectedChannel}
            onChannelSelect={(channelId) => {
              setSelectedChannel(channelId);
              const channel = channels.find(c => c._id === channelId);
              setCurrentChannel(channel || null);
            }}
            serverName={currentServer?.name || "My Server"}
            onSettingsClick={() => setShowSettings(true)}
          />
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex">
          {selectedServer === "dm" ? (
            currentDMUser ? (
              <DMChatArea dmUser={currentDMUser} />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-[#36393f]">
                <div className="text-center text-[#8e9297]">
                  <div className="text-6xl mb-4">💬</div>
                  <div className="text-xl font-semibold mb-2">Direct Messages</div>
                  <div>Select a friend to start messaging</div>
                </div>
              </div>
            )
          ) : (
            <>
              <ChatArea 
                channelName={currentChannel?.name || "general"} 
                channelId={currentChannel?._id || ""}
                currentServer={currentServer}
              />
              <UserList />
            </>
          )}
        </div>

        {/* Settings Modal */}
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        
        {/* Notification Panel */}
        <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
      </div>
    </ProtectedRoute>
  )
}
