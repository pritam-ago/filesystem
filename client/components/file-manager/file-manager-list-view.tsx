"use client"

import type React from "react"

import { useState } from "react"

import { Folder, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FileItem, FolderItem } from "@/lib/types"
import { getFileIcon, formatFileSize } from "@/lib/file-utils"

// Shows the real thumbnail where one exists, falling back to the type icon for
// everything else - unsupported types, files predating thumbnail support, or an
// expired URL.
function RowThumbnail({ file }: { file: FileItem }) {
  const [failed, setFailed] = useState(false)
  const FileIcon = getFileIcon(file.name)

  if (file.thumbnailUrl && !failed) {
    return (
      <img
        src={file.thumbnailUrl}
        alt=""
        loading="lazy"
        className="h-5 w-5 shrink-0 rounded object-cover"
        onError={() => setFailed(true)}
      />
    )
  }

  return <FileIcon className="h-4 w-4 shrink-0 text-primary" />
}

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

  // Opens the same menu as right-clicking the row. stopPropagation keeps the
  // click off the row itself, which would otherwise navigate into the folder.
  const handleMenuClick = (e: React.MouseEvent, key: string, isFolder: boolean) => {
    e.stopPropagation()
    onContextMenu(e, key, isFolder)
  }

  return (
    <div className="w-full overflow-hidden rounded-md border">
      <div className="grid grid-cols-12 gap-2 border-b bg-muted/50 p-2 text-xs font-medium">
        <div className="col-span-5">Name</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-4">Last Modified</div>
        <div className="col-span-1 sr-only">Actions</div>
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
              <div className="col-span-5 flex items-center gap-2 truncate">
                <Folder className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate font-medium">{folder.name}</span>
              </div>
              <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                {formatFileSize(folder.size)}
              </div>
              <div className="col-span-4 flex items-center text-sm text-muted-foreground">
                {formatDate(folder.lastModified)}
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  type="button"
                  aria-label={`Actions for folder ${folder.name}`}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={(e) => handleMenuClick(e, folderPath, true)}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}

        {files.map((file) => {
          return (
            <div
              key={file.key}
              className={cn("group grid grid-cols-12 gap-2 p-2 hover:bg-accent")}
              onClick={() => handleItemClick(file.key, false)}
              onContextMenu={(e) => onContextMenu(e, file.key, false)}
            >
              <div className="col-span-5 flex items-center gap-2 truncate">
                <RowThumbnail file={file} />
                <span className="truncate">{file.name}</span>
              </div>
              <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </div>
              <div className="col-span-4 flex items-center text-sm text-muted-foreground">
                {formatDate(file.lastModified)}
              </div>
              <div className="col-span-1 flex items-center justify-end">
                <button
                  type="button"
                  aria-label={`Actions for file ${file.name}`}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={(e) => handleMenuClick(e, file.key, false)}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
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
