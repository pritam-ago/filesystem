"use client"

import type React from "react"

import { Folder, FileText, Image, Video, File, MoreVertical } from "lucide-react"
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

const stripUserPrefix = (path: string) => path.replace(/^users\/[^/]+\//, "");

export function FileManagerGridView({
  files,
  folders,
  currentPath,
  onNavigate,
  onContextMenu,
}: FileManagerGridViewProps) {
  const handleItemClick = (key: string, isFolder: boolean) => {
    if (isFolder) {
      onNavigate(stripUserPrefix(key));
    }
  }

  const handleFolderDoubleClick = (folder: string) => {
    onNavigate(stripUserPrefix(folder));
  }

  // Opens the same menu as right-clicking the card. stopPropagation keeps the
  // click off the card itself, which would otherwise navigate into the folder.
  const handleMenuClick = (e: React.MouseEvent, key: string, isFolder: boolean) => {
    e.stopPropagation()
    onContextMenu(e, key, isFolder)
  }

  const menuButton = (key: string, isFolder: boolean, label: string) => (
    <button
      type="button"
      aria-label={`Actions for ${isFolder ? "folder" : "file"} ${label}`}
      className="absolute right-1 top-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={(e) => handleMenuClick(e, key, isFolder)}
    >
      <MoreVertical className="h-4 w-4" />
    </button>
  )

  const getFileThumbnail = (file: FileItem) => {
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    if (file.thumbnailUrl) {
      return (
        <div className="relative h-24 w-24 overflow-hidden rounded-lg">
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.png';
            }}
          />
        </div>
      )
    }
    
    if (file.type?.startsWith('image/')) {
      return (
        <div className="relative h-24 w-24 overflow-hidden rounded-lg">
        <img
          src={file.url}
          alt={file.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder-image.png';
            }}
        />
        </div>
      )
    }
    
    if (file.type?.startsWith('video/')) {
      return (
        <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-primary/10">
          {file.url ? (
            <video
              src={file.url}
              className="h-full w-full object-cover"
              preload="metadata"
            />
          ) : (
            <Video className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-primary" />
          )}
        </div>
      )
    }
    
    if (file.type === 'application/pdf') {
      return (
        <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-primary/10">
          {file.url ? (
            <iframe
              src={`${file.url}#toolbar=0&navpanes=0`}
              className="h-full w-full"
              title={file.name}
            />
          ) : (
            <FileText className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-primary" />
          )}
        </div>
      )
    }
    
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-primary/10">
        <File className="h-8 w-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {folders.map((folder) => {
        // Always the full object key, exactly as the list view does it. Building
        // it from currentPath instead dropped the users/<id>/ prefix, which was
        // fine for navigation (stripUserPrefix is a no-op then) but gave the
        // actions menu a key that matches no object, so delete, rename and
        // download all silently targeted nothing.
        const folderPath = folder.key

        return (
          <div
            key={folderPath}
            className={cn(
              "group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border p-4 transition-colors hover:bg-accent",
            )}
            onClick={() => handleItemClick(folderPath, true)}
            onDoubleClick={() => handleFolderDoubleClick(folderPath)}
            onContextMenu={(e) => onContextMenu(e, folderPath, true)}
          >
            {menuButton(folderPath, true, folder.name)}
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-primary/10">
              <Folder className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2 w-full truncate text-center font-medium">{folder.name}</div>
            <div className="text-xs text-muted-foreground">{formatFileSize(folder.size)}</div>
          </div>
        )
      })}

      {files.map((file) => {
        return (
          <div
            key={file.key}
            className={cn(
              "group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border p-4 transition-colors hover:bg-accent",
            )}
            onClick={() => handleItemClick(file.key, false)}
            onContextMenu={(e) => onContextMenu(e, file.key, false)}
          >
            {menuButton(file.key, false, file.name)}
            {getFileThumbnail(file)}
            <div className="mt-2 w-full truncate text-center font-medium">{file.name}</div>
            <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
          </div>
        )
      })}
    </div>
  )
}
