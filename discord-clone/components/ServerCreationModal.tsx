"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useServer } from "@/contexts/ServerContext"
import { toast } from "sonner"

interface ServerCreationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ServerCreationModal({ isOpen, onClose }: ServerCreationModalProps) {
  const { createServer } = useServer()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsCreating(true)
    try {
      await createServer(name.trim(), description.trim() || undefined)
      toast.success("Server created successfully!")
      setName("")
      setDescription("")
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to create server")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#36393f] border-[#4f545c] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Your Server</DialogTitle>
          <DialogDescription className="text-[#b9bbbe]">
            Give your new server a personality with a name and an icon. You can always change it later.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="serverName" className="text-[#b9bbbe] text-sm font-bold uppercase">
              Server Name
            </Label>
            <Input
              id="serverName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter server name"
              className="mt-2 bg-[#202225] border-[#4f545c] text-white placeholder-[#72767d]"
              maxLength={100}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="serverDescription" className="text-[#b9bbbe] text-sm font-bold uppercase">
              Server Description (Optional)
            </Label>
            <Textarea
              id="serverDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this server about?"
              className="mt-2 bg-[#202225] border-[#4f545c] text-white placeholder-[#72767d]"
              rows={3}
              maxLength={500}
            />
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
              disabled={isCreating || !name.trim()}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
            >
              {isCreating ? "Creating..." : "Create Server"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
