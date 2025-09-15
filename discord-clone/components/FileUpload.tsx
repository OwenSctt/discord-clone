"use client"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import axios from "axios"
import { Upload, X, Image, Video, File, Check } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface FileUploadProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: (fileUrl: string, fileName: string, fileType: string) => void
  channelId?: string
}

interface UploadedFile {
  url: string
  filename: string
  type: string
  size: number
}

export function FileUpload({ isOpen, onClose, onUploadComplete, channelId }: FileUploadProps) {
  const { token } = useAuth()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    const file = files[0]
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB")
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
      toast.error("File type not supported. Please upload images or videos.")
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (channelId) {
        formData.append('channelId', channelId)
      }

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          setUploadProgress(progress)
        }
      })

      const uploadedFile: UploadedFile = {
        url: response.data.url,
        filename: response.data.filename,
        type: response.data.type,
        size: file.size
      }

      setUploadedFiles(prev => [...prev, uploadedFile])
      onUploadComplete(uploadedFile.url, uploadedFile.filename, uploadedFile.type)
      toast.success("File uploaded successfully!")
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload file")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={20} />
    if (type.startsWith('video/')) return <Video size={20} />
    return <File size={20} />
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#36393f] border-[#4f545c] text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Upload File</DialogTitle>
          <DialogDescription className="text-[#b9bbbe]">
            Upload images or videos to share with your friends
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? "border-[#5865f2] bg-[#5865f2]/10" 
                : "border-[#4f545c] hover:border-[#5865f2]"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload size={48} className="mx-auto text-[#8e9297] mb-4" />
            <p className="text-white text-lg mb-2">Drop files here or click to browse</p>
            <p className="text-[#8e9297] text-sm mb-4">
              Supports images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV)
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-[#5865f2] hover:bg-[#4752c4]"
            >
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInput}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#b9bbbe]">Uploading...</span>
                <span className="text-white">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-white font-medium">Uploaded Files</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#2f3136] rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="text-white text-sm font-medium">{file.filename}</p>
                        <p className="text-[#8e9297] text-xs">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check size={16} className="text-green-400" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
