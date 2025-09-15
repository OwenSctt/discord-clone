"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useServer } from "@/contexts/ServerContext"
import { toast } from "sonner"

interface ServerJoinModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ServerJoinModal({ isOpen, onClose }: ServerJoinModalProps) {
  const { joinServer } = useServer()
  const [inviteCode, setInviteCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return

    setIsJoining(true)
    try {
      // Extract invite code from URL if full URL is provided
      let code = inviteCode.trim()
      if (code.includes('/invite/')) {
        code = code.split('/invite/')[1]
      }
      if (code.includes('http://') || code.includes('https://')) {
        code = code.split('/').pop() || code
      }
      
      console.log('Attempting to join server with invite code:', code)
      await joinServer(code)
      toast.success("Successfully joined server!")
      setInviteCode("")
      onClose()
    } catch (error: any) {
      console.error('Server join error:', error)
      toast.error(error.message || "Failed to join server")
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#36393f] border-[#4f545c] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Join a Server</DialogTitle>
          <DialogDescription className="text-[#b9bbbe]">
            Enter an invite below to join an existing server
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="inviteCode" className="text-[#b9bbbe] text-sm font-bold uppercase">
              Invite Link
            </Label>
            <Input
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="https://discord.gg/invite or invite code"
              className="mt-2 bg-[#202225] border-[#4f545c] text-white placeholder-[#72767d]"
              required
            />
            <p className="text-xs text-[#72767d] mt-1">
              You can paste the full invite link or just the invite code
            </p>
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
              disabled={isJoining || !inviteCode.trim()}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
            >
              {isJoining ? "Joining..." : "Join Server"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
