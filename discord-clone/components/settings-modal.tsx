"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserProfile } from "@/components/UserProfile"
import { FriendManagement } from "@/components/FriendManagement"
import { useAuth } from "@/contexts/AuthContext"
import { X, User, Bell, Shield, Palette, Keyboard, Languages, Mic, Volume2, LogOut, Users } from "lucide-react"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("account")
  const [showFriendManagement, setShowFriendManagement] = useState(false)
  const { user, logout } = useAuth()

  if (!isOpen) return null

  const tabs = [
    { id: "account", label: "My Account", icon: User },
    { id: "friends", label: "Friends", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Safety", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "keybinds", label: "Keybinds", icon: Keyboard },
    { id: "language", label: "Language", icon: Languages },
    { id: "voice", label: "Voice & Video", icon: Mic },
    { id: "audio", label: "Audio & Video", icon: Volume2 },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#36393f] rounded-lg w-full max-w-4xl h-[80vh] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-60 bg-[#2f3136] p-4">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  variant="ghost"
                  className={`w-full justify-start px-3 py-2 text-left ${
                    activeTab === tab.id
                      ? "bg-[#393c43] text-white"
                      : "text-[#8e9297] hover:text-white hover:bg-[#393c43]"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} className="mr-3" />
                  {tab.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-[#202225]">
            <h1 className="text-white text-xl font-semibold">{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-[#b9bbbe] hover:text-white">
              <X size={24} />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "account" && (
              <div className="space-y-6">
                <div className="bg-[#5865f2] p-4 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-[#36393f] text-white text-2xl">
                        {user?.displayName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-white text-2xl font-bold">{user?.displayName}</h2>
                      <p className="text-white/80">#{user?.username}</p>
                      <p className="text-white/60 text-sm">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <UserProfile onClose={() => setActiveTab("account")} />

                <div className="pt-4 border-t border-[#4f545c]">
                  <Button
                    onClick={logout}
                    variant="destructive"
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "friends" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white text-lg font-semibold">Friends</h3>
                    <p className="text-[#8e9297] text-sm">Manage your friends and friend requests</p>
                  </div>
                  <Button
                    onClick={() => setShowFriendManagement(true)}
                    className="bg-[#5865f2] hover:bg-[#4752c4]"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manage Friends
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Enable Desktop Notifications</h3>
                      <p className="text-[#8e9297] text-sm">Get notified when you receive new messages</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Enable Unread Message Badge</h3>
                      <p className="text-[#8e9297] text-sm">Show unread message count in taskbar</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Enable Push Notifications</h3>
                      <p className="text-[#8e9297] text-sm">Receive notifications on mobile devices</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-medium mb-4">Theme</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#202225] p-4 rounded-lg border-2 border-[#5865f2]">
                      <div className="w-full h-20 bg-[#36393f] rounded mb-2"></div>
                      <p className="text-white text-center">Dark</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border-2 border-transparent">
                      <div className="w-full h-20 bg-gray-100 rounded mb-2"></div>
                      <p className="text-black text-center">Light</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Developer Mode</h3>
                    <p className="text-[#8e9297] text-sm">Show additional developer options</p>
                  </div>
                  <Switch />
                </div>
              </div>
            )}

            {activeTab === "voice" && (
              <div className="space-y-6">
                <div>
                  <Label className="text-[#b9bbbe] text-sm font-bold uppercase">Input Device</Label>
                  <select className="w-full mt-2 bg-[#202225] border-none text-white p-2 rounded">
                    <option>Default - Built-in Microphone</option>
                    <option>External Microphone</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[#b9bbbe] text-sm font-bold uppercase">Output Device</Label>
                  <select className="w-full mt-2 bg-[#202225] border-none text-white p-2 rounded">
                    <option>Default - Built-in Speakers</option>
                    <option>Headphones</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Noise Suppression</h3>
                    <p className="text-[#8e9297] text-sm">Reduce background noise</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Friend Management Modal */}
      <FriendManagement 
        isOpen={showFriendManagement} 
        onClose={() => setShowFriendManagement(false)} 
      />
    </div>
  )
}
