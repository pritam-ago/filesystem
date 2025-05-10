"use client"

import React from "react"

import { FolderPlus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileManagerEmptyStateProps {
  onUploadFiles: (files: File[]) => Promise<void>
  onCreateFolder: (folderName: string) => Promise<void>
}

export function FileManagerEmptyState({ onUploadFiles, onCreateFolder }: FileManagerEmptyStateProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

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
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FolderPlus className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium">No files or folders</h3>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Upload files or create a new folder to get started.
      </p>
      <div className="mt-6 flex gap-4">
        <Button onClick={handleUploadClick}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Files
        </Button>
        <Button variant="outline" onClick={() => onCreateFolder("New Folder")}>
          <FolderPlus className="mr-2 h-4 w-4" />
          Create Folder
        </Button>
        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
      </div>
    </div>
  )
}
