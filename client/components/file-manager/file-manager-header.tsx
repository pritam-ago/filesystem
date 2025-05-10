"use client"

import React from "react"

import { useState } from "react"
import { FolderPlus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FileManagerHeaderProps {
  onCreateFolder: (folderName: string) => Promise<void>
  onUploadFiles: (files: File[]) => Promise<void>
}

export function FileManagerHeader({ onCreateFolder, onUploadFiles }: FileManagerHeaderProps) {
  const [folderName, setFolderName] = useState("")
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return

    setIsCreatingFolder(true)
    try {
      await onCreateFolder(folderName)
      setFolderName("")
      setIsCreateFolderOpen(false)
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    await onUploadFiles(files)

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex items-center justify-between border-b p-4">
      <div className="flex items-center gap-2">
        <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create new folder</DialogTitle>
              <DialogDescription>Enter a name for the new folder.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="folder-name">Folder name</Label>
                <Input
                  id="folder-name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="New folder"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={!folderName.trim() || isCreatingFolder}>
                {isCreatingFolder ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" size="sm" onClick={handleUploadClick}>
          <Upload className="mr-2 h-4 w-4" />
          Upload
        </Button>
        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
      </div>
    </div>
  )
}
