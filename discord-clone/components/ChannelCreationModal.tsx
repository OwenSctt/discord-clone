"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useServer } from "@/contexts/ServerContext"
import { toast } from "sonner"

interface ChannelCreationModalProps {
  isOpen: boolean
  onClose: () => void
  serverId?: string
}

export function ChannelCreationModal({ isOpen, onClose, serverId }: ChannelCreationModalProps) {
  const { createChannel } = useServer()
  const [name, setName] = useState("")
  const [type, setType] = useState<'text' | 'voice' | 'category'>('text')
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !serverId) return

    setIsCreating(true)
    try {
      await createChannel(name.trim(), type, serverId)
      toast.success("Channel created successfully!")
      setName("")
      setType('text')
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to create channel")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#36393f] border-[#4f545c] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Channel</DialogTitle>
          <DialogDescription className="text-[#b9bbbe]">
            Create a new channel for your server
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="channelName" className="text-[#b9bbbe] text-sm font-bold uppercase">
              Channel Name
            </Label>
            <Input
              id="channelName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new-channel"
              className="mt-2 bg-[#202225] border-[#4f545c] text-white placeholder-[#72767d]"
              maxLength={100}
              required
            />
            <p className="text-xs text-[#72767d] mt-1">
              Channel names must be lowercase and contain no spaces
            </p>
          </div>
          
          <div>
            <Label htmlFor="channelType" className="text-[#b9bbbe] text-sm font-bold uppercase">
              Channel Type
            </Label>
            <Select value={type} onValueChange={(value: 'text' | 'voice' | 'category') => setType(value)}>
              <SelectTrigger className="w-full mt-2 bg-[#202225] border-[#4f545c] text-white">
                <SelectValue placeholder="Select channel type" />
              </SelectTrigger>
              <SelectContent className="bg-[#202225] text-white border-[#4f545c]">
                <SelectItem value="text">Text Channel</SelectItem>
                <SelectItem value="voice">Voice Channel</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !name.trim() || !serverId}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
            >
              {isCreating ? "Creating..." : "Create Channel"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
