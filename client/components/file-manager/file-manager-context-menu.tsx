"use client"

import { useState } from "react"
import { Copy, Download, Folder, Move, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FolderItem } from "@/lib/types"

interface FileManagerContextMenuProps {
  position: { x: number; y: number }
  target: { key: string; isFolder: boolean }
  currentPath: string
  folders: FolderItem[]
  onClose: () => void
  onDelete: (key: string, isFolder: boolean) => Promise<void>
  onDownload: () => Promise<void>
  onCopy: (targetFolder: string) => Promise<void>
  onMove: (targetFolder: string) => Promise<void>
  onRename: (newName: string) => Promise<void>
}

export function FileManagerContextMenu({
  position,
  target,
  currentPath,
  folders,
  onClose,
  onDelete,
  onDownload,
  onCopy,
  onMove,
  onRename,
}: FileManagerContextMenuProps) {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newName, setNewName] = useState(target.key.split("/").pop() || "")
  const [selectedFolder, setSelectedFolder] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRename = async () => {
    if (!newName.trim()) return

    setIsProcessing(true)
    try {
      await onRename(newName)
      setIsRenameDialogOpen(false)
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopy = async () => {
    if (!selectedFolder) return

    setIsProcessing(true)
    try {
      await onCopy(selectedFolder)
      setIsCopyDialogOpen(false)
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMove = async () => {
    if (!selectedFolder) return

    setIsProcessing(true)
    try {
      await onMove(selectedFolder)
      setIsMoveDialogOpen(false)
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    setIsProcessing(true)
    try {
      await onDelete(target.key, target.isFolder)
      setIsDeleteDialogOpen(false)
      onClose()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async () => {
    await onDownload()
    onClose()
  }

  // Filter out the current folder from the list of available folders
  const availableFolders = folders.filter((folder) => {
    const folderPath = currentPath ? `${currentPath}/${folder.name}` : folder.key
    return folderPath !== target.key
  })

  // Add the root folder as an option
  const allFolders = ["Root"].concat(availableFolders.map((folder) => folder.name))

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 min-w-[160px] overflow-hidden rounded-md border bg-background p-1 shadow-md"
        style={{
          top: `${position.y}px`,
          left: `${position.x}px`,
        }}
      >
        <button
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          onClick={() => {
            setIsRenameDialogOpen(true)
          }}
        >
          <Pencil className="h-4 w-4" />
          Rename
        </button>
        <button
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          Download
        </button>
        <button
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          onClick={() => {
            setIsCopyDialogOpen(true)
          }}
        >
          <Copy className="h-4 w-4" />
          Copy to
        </button>
        <button
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          onClick={() => {
            setIsMoveDialogOpen(true)
          }}
        >
          <Move className="h-4 w-4" />
          Move to
        </button>
        <button
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-500 hover:bg-accent"
          onClick={() => {
            setIsDeleteDialogOpen(true)
          }}
        >
          <Trash className="h-4 w-4" />
          Delete
        </button>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {target.isFolder ? "folder" : "file"}</DialogTitle>
            <DialogDescription>Enter a new name for the {target.isFolder ? "folder" : "file"}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-name">New name</Label>
              <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim() || isProcessing}>
              {isProcessing ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Dialog */}
      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy to folder</DialogTitle>
            <DialogDescription>
              Select a destination folder to copy the {target.isFolder ? "folder" : "file"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="destination-folder">Destination folder</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {allFolders.map((folder) => (
                    <SelectItem key={folder} value={folder === "Root" ? "" : folder}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {folder}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCopyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCopy} disabled={(!selectedFolder && selectedFolder !== "") || isProcessing}>
              {isProcessing ? "Copying..." : "Copy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to folder</DialogTitle>
            <DialogDescription>
              Select a destination folder to move the {target.isFolder ? "folder" : "file"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="destination-folder">Destination folder</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  {allFolders.map((folder) => (
                    <SelectItem key={folder} value={folder === "Root" ? "" : folder}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        {folder}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMove} disabled={(!selectedFolder && selectedFolder !== "") || isProcessing}>
              {isProcessing ? "Moving..." : "Move"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {target.isFolder ? "folder" : "file"}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {target.isFolder ? "folder" : "file"}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              {isProcessing ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
