"use client"

import type React from "react"

import { useState } from "react"
import { FileManagerGridView } from "./file-manager-grid-view"
import { FileManagerListView } from "./file-manager-list-view"
import { FileManagerContextMenu } from "./file-manager-context-menu"
import { useFileManager } from "@/lib/file-manager-provider"
import type { FileItem, FolderItem } from "@/lib/types"

interface FileManagerContentProps {
  files: FileItem[]
  folders: FolderItem[]
  currentPath: string
  onNavigate: (path: string) => void
  onDeleteItem: (key: string, isFolder: boolean) => Promise<void>
  onDownloadFile: (file: FileItem) => Promise<void>
  onDownloadFolder: (folder: string) => Promise<void>
  onCopyFiles: (keys: string[], targetFolder: string) => Promise<void>
  onMoveFiles: (keys: string[], targetFolder: string) => Promise<void>
  onRenameItem: (key: string, newName: string, isFolder: boolean) => Promise<void>
  onUploadFiles: (files: File[]) => Promise<void>
}

export function FileManagerContent({
  files,
  folders,
  currentPath,
  onNavigate,
  onDeleteItem,
  onDownloadFile,
  onDownloadFolder,
  onCopyFiles,
  onMoveFiles,
  onRenameItem,
  onUploadFiles,
}: FileManagerContentProps) {
  const { viewMode, selectedItems, setSelectedItems } = useFileManager()
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [contextMenuTarget, setContextMenuTarget] = useState<{ key: string; isFolder: boolean } | null>(null)

  const handleContextMenu = (e: React.MouseEvent, key: string, isFolder: boolean) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
    setContextMenuTarget({ key, isFolder })
  }

  const closeContextMenu = () => {
    setContextMenuPosition(null)
    setContextMenuTarget(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()

    if (e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      await onUploadFiles(files)
    }
  }

  return (
    <div className="flex-1 overflow-auto p-4" onDragOver={handleDragOver} onDrop={handleDrop}>
      {viewMode === "grid" ? (
        <FileManagerGridView
          files={files}
          folders={folders}
          currentPath={currentPath}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          onNavigate={onNavigate}
          onContextMenu={handleContextMenu}
        />
      ) : (
        <FileManagerListView
          files={files}
          folders={folders}
          currentPath={currentPath}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          onNavigate={onNavigate}
          onContextMenu={handleContextMenu}
        />
      )}

      {contextMenuPosition && contextMenuTarget && (
        <FileManagerContextMenu
          position={contextMenuPosition}
          target={contextMenuTarget}
          currentPath={currentPath}
          folders={folders}
          onClose={closeContextMenu}
          onDelete={onDeleteItem}
          onDownload={
            contextMenuTarget.isFolder
              ? () => onDownloadFolder(contextMenuTarget.key)
              : () => onDownloadFile(files.find((f) => f.key === contextMenuTarget.key)!)
          }
          onCopy={(targetFolder) => onCopyFiles([contextMenuTarget.key], targetFolder)}
          onMove={(targetFolder) => onMoveFiles([contextMenuTarget.key], targetFolder)}
          onRename={(newName) => onRenameItem(contextMenuTarget.key, newName, contextMenuTarget.isFolder)}
        />
      )}
    </div>
  )
}
