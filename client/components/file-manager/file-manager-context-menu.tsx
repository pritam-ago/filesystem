"use client"

import { useEffect, useState } from "react"
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
import { splitFileName } from "@/lib/file-utils"

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
  // Folder keys end in "/", so strip it before taking the last segment -
  // otherwise pop() returns "" and the rename dialog opens blank.
  const currentName = target.key.replace(/\/+$/, "").split("/").pop() || ""
  const { base, extension } = splitFileName(currentName, target.isFolder)

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [newName, setNewName] = useState(base)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRename = async () => {
    if (!newName.trim()) return

    setIsProcessing(true)
    try {
      // The extension is never editable, so put the original one back.
      await onRename(`${newName.trim()}${extension}`)
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

  // Close on Escape, matching how the menu behaves everywhere else.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  // The menu is opened either at the pointer (right-click) or at the actions
  // button, which sits hard against the right edge of a row. Clamp it into the
  // viewport so it never opens off-screen.
  const MENU_WIDTH = 200
  const MENU_HEIGHT = 150
  const MARGIN = 8
  const viewportWidth = typeof window === "undefined" ? Number.MAX_SAFE_INTEGER : window.innerWidth
  const viewportHeight = typeof window === "undefined" ? Number.MAX_SAFE_INTEGER : window.innerHeight
  const left = Math.max(MARGIN, Math.min(position.x, viewportWidth - MENU_WIDTH - MARGIN))
  const top = Math.max(MARGIN, Math.min(position.y, viewportHeight - MENU_HEIGHT - MARGIN))

  // While a dialog is open it owns the interaction, so the popup and its
  // backdrop step aside rather than unmounting the dialog underneath it.
  const isDialogOpen = isRenameDialogOpen || isDeleteDialogOpen

  return (
    <>
      {!isDialogOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
            onContextMenu={(e) => {
              e.preventDefault()
              onClose()
            }}
          />
          <div
            className="fixed z-50 min-w-[200px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            style={{ top, left }}
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
        </>
      )}

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {target.isFolder ? "folder" : "file"}</DialogTitle>
            <DialogDescription>
              {extension
                ? `Enter a new name. The ${extension} extension is kept so the file stays usable.`
                : `Enter a new name for this ${target.isFolder ? "folder" : "file"}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="name"
                  className="flex-1"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRename()
                    }
                  }}
                />
                {extension && (
                  <span
                    className="shrink-0 select-none rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground"
                    title="The extension cannot be changed"
                  >
                    {extension}
                  </span>
                )}
              </div>
              {extension && (
                <p className="text-xs text-muted-foreground">
                  Renames to <span className="font-medium">{`${newName.trim()}${extension}`}</span>
                </p>
              )}
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
