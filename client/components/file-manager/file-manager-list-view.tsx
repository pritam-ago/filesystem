"use client"

import type React from "react"

import { Folder } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileItem, FolderItem } from "@/lib/types"
import { getFileIcon, formatFileSize } from "@/lib/file-utils"

interface FileManagerListViewProps {
  files: FileItem[]
  folders: FolderItem[]
  currentPath: string
  onNavigate: (path: string) => void
  onContextMenu: (e: React.MouseEvent, key: string, isFolder: boolean) => void
}

export function FileManagerListView({
  files,
  folders,
  currentPath,
  onNavigate,
  onContextMenu,
}: FileManagerListViewProps) {
  const stripUserPrefix = (path: string) => path.replace(/^users\/[^/]+\//, "");

  const handleItemClick = (key: string, isFolder: boolean) => {
    if (isFolder) {
      onNavigate(stripUserPrefix(key));
    }
  }

  const handleFolderDoubleClick = (folder: string) => {
    onNavigate(stripUserPrefix(folder));
  }

  return (
    <div className="w-full overflow-hidden rounded-md border">
      <div className="grid grid-cols-12 gap-2 border-b bg-muted/50 p-2 text-xs font-medium">
        <div className="col-span-6">Name</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-4">Last Modified</div>
      </div>
      <div className="divide-y">
        {folders.map((folder) => {
          const folderPath = folder.key;

          return (
            <div
              key={folderPath}
              className={cn("group grid grid-cols-12 gap-2 p-2 hover:bg-accent")}
              onClick={() => handleItemClick(folderPath, true)}
              onDoubleClick={() => handleFolderDoubleClick(folderPath)}
              onContextMenu={(e) => onContextMenu(e, folderPath, true)}
            >
              <div className="col-span-6 flex items-center gap-2 truncate">
                <Folder className="h-4 w-4 text-primary" />
                <span className="truncate font-medium">{folder.name}</span>
              </div>
              <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                {formatFileSize(folder.size)}
              </div>
              <div className="col-span-4 flex items-center text-sm text-muted-foreground">
                {formatDate(folder.lastModified)}
              </div>
            </div>
          )
        })}

        {files.map((file) => {
          const FileIcon = getFileIcon(file.name)

          return (
            <div
              key={file.key}
              className={cn("group grid grid-cols-12 gap-2 p-2 hover:bg-accent")}
              onClick={() => handleItemClick(file.key, false)}
              onContextMenu={(e) => onContextMenu(e, file.key, false)}
            >
              <div className="col-span-6 flex items-center gap-2 truncate">
                <FileIcon className="h-4 w-4 text-primary" />
                <span className="truncate">{file.name}</span>
              </div>
              <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </div>
              <div className="col-span-4 flex items-center text-sm text-muted-foreground">
                {formatDate(file.lastModified)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatDate(date: Date | string | undefined | null): string {
  if (!date) return "—";
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString()
}
