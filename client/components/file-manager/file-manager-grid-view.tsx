"use client"

import type React from "react"

import { useState } from "react"

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

// The API returns a presigned thumbnailUrl only when a thumbnail actually
// exists in storage. Everything else - unsupported types, files uploaded before
// thumbnails worked, a URL that has since expired - falls back to the type icon
// rather than rendering a broken image.
function FileThumbnail({ file }: { file: FileItem }) {
  const [failed, setFailed] = useState(false)

  if (file.thumbnailUrl && !failed) {
    return (
      <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-primary/10">
        <img
          src={file.thumbnailUrl}
          alt={file.name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
        {file.type?.startsWith("video/") && (
          <span className="absolute bottom-1 right-1 rounded bg-black/60 p-0.5">
            <Video className="h-3 w-3 text-white" />
          </span>
        )}
      </div>
    )
  }

  const Icon = file.type?.startsWith("image/")
    ? Image
    : file.type?.startsWith("video/")
      ? Video
      : file.type === "application/pdf"
        ? FileText
        : File

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-primary/10">
      <Icon className="h-8 w-8 text-primary" />
    </div>
  )
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
            <FileThumbnail file={file} />
            <div className="mt-2 w-full truncate text-center font-medium">{file.name}</div>
            <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
          </div>
        )
      })}
    </div>
  )
}
