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
  onRename,
}: FileManagerContextMenuProps) {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newName, setNewName] = useState(target.key.split("/").pop() || "")
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

  return (
    <>
      <div
        className="fixed z-50 min-w-[200px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        style={{ top: position.y, left: position.x }}
      >
        <div className="flex flex-col">
          <Button
            variant="ghost"
            className="justify-start"
            onClick={handleDownload}
          >
            <Download className="mr-2 h-4 w-4" />
            {target.isFolder ? "Download as ZIP" : "Download"}
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={() => setIsRenameDialogOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </Button>
          <Button
            variant="ghost"
            className="justify-start text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {target.isFolder ? "folder" : "file"}</DialogTitle>
            <DialogDescription>
              Enter a new name for this {target.isFolder ? "folder" : "file"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRename()
                  }
                }}
              />
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
