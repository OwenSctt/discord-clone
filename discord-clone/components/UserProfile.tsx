"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserProfileProps {
  onClose: () => void
}

export const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user, updateProfile, changePassword, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    status: user?.status || "online"
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateProfile(formData)
      setSuccess("Profile updated successfully!")
      setIsEditing(false)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile")
      setTimeout(() => setError(""), 5000)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords don't match")
      return
    }
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword)
      setSuccess("Password changed successfully!")
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setIsChangingPassword(false)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password")
      setTimeout(() => setError(""), 5000)
    }
  }

  if (!user) return null

  return (
    <div className="bg-[#36393f] text-white p-6 rounded-lg max-w-md w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">User Profile</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded text-sm mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-2 rounded text-sm mb-4">
          {success}
        </div>
      )}

      <div className="space-y-4">
        {/* User Info Display */}
        {!isEditing && !isChangingPassword && (
          <>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-[#5865f2] rounded-full flex items-center justify-center text-2xl font-bold">
                {user.displayName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{user.displayName}</h3>
                <p className="text-gray-400">#{user.username}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
            </div>

            {user.bio && (
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-1">Bio</h4>
                <p className="text-sm">{user.bio}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-gray-400 mb-1">Status</h4>
              <p className="text-sm capitalize">{user.status}</p>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#5865f2] hover:bg-[#4752c4]"
              >
                Edit Profile
              </Button>
              <Button
                onClick={() => setIsChangingPassword(true)}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Change Password
              </Button>
            </div>
          </>
        )}

        {/* Profile Edit Form */}
        {isEditing && (
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <Label htmlFor="displayName" className="text-sm font-semibold text-gray-400">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="mt-1 bg-[#202225] border-gray-600 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="bio" className="text-sm font-semibold text-gray-400">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="mt-1 bg-[#202225] border-gray-600 text-white"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-semibold text-gray-400">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger className="mt-1 bg-[#202225] border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="invisible">Invisible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#5865f2] hover:bg-[#4752c4]"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    displayName: user.displayName || "",
                    bio: user.bio || "",
                    status: user.status || "online"
                  })
                }}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Password Change Form */}
        {isChangingPassword && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword" className="text-sm font-semibold text-gray-400">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="mt-1 bg-[#202225] border-gray-600 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-400">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="mt-1 bg-[#202225] border-gray-600 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-400">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="mt-1 bg-[#202225] border-gray-600 text-white"
                required
              />
            </div>

            <div className="flex space-x-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#5865f2] hover:bg-[#4752c4]"
              >
                {loading ? "Changing..." : "Change Password"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false)
                  setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
                }}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
