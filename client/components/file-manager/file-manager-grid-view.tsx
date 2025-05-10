"use client"

import type React from "react"

import { Folder } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileItem, FolderItem } from "@/lib/types"
import { getFileIcon, formatFileSize } from "@/lib/file-utils"

interface FileManagerGridViewProps {
  files: FileItem[]
  folders: FolderItem[]
  currentPath: string
  onNavigate: (path: string) => void
  onContextMenu: (e: React.MouseEvent, key: string, isFolder: boolean) => void
}

export function FileManagerGridView({
  files,
  folders,
  currentPath,
  onNavigate,
  onContextMenu,
}: FileManagerGridViewProps) {
  const handleItemClick = (key: string, isFolder: boolean) => {
    if (isFolder) {
      onNavigate(key)
    }
  }

  const handleFolderDoubleClick = (folder: string) => {
    onNavigate(folder)
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {folders.map((folder) => {
        const folderPath = currentPath ? `${currentPath}/${folder.name}` : folder.key

        return (
          <div
            key={folderPath}
            className={cn(
              "group flex cursor-pointer flex-col items-center justify-center rounded-lg border p-4 transition-colors hover:bg-accent",
            )}
            onClick={() => handleItemClick(folderPath, true)}
            onDoubleClick={() => handleFolderDoubleClick(folderPath)}
            onContextMenu={(e) => onContextMenu(e, folderPath, true)}
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Folder className="h-6 w-6 text-primary" />
            </div>
            <div className="w-full truncate text-center font-medium">{folder.name}</div>
          </div>
        )
      })}

      {files.map((file) => {
        const FileIcon = getFileIcon(file.name)

        return (
          <div
            key={file.key}
            className={cn(
              "group flex cursor-pointer flex-col items-center justify-center rounded-lg border p-4 transition-colors hover:bg-accent",
            )}
            onClick={() => handleItemClick(file.key, false)}
            onContextMenu={(e) => onContextMenu(e, file.key, false)}
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="w-full truncate text-center font-medium">{file.name}</div>
            <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
          </div>
        )
      })}
    </div>
  )
}
