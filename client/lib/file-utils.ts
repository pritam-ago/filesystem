import {
  FileIcon,
  FileTextIcon,
  ImageIcon,
  MusicIcon,
  VideoIcon,
  FileArchiveIcon,
  FileCodeIcon,
  FileSpreadsheetIcon,
  FileIcon as FilePresentationIcon,
} from "lucide-react"
import type { FileItem } from "./types"

export function getFileIcon(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || ""

  switch (extension) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
    case "webp":
      return ImageIcon
    case "mp4":
    case "webm":
    case "mov":
    case "avi":
      return VideoIcon
    case "mp3":
    case "wav":
    case "ogg":
      return MusicIcon
    case "pdf":
    case "doc":
    case "docx":
    case "txt":
    case "md":
      return FileTextIcon
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return FileArchiveIcon
    case "html":
    case "css":
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "json":
      return FileCodeIcon
    case "xls":
    case "xlsx":
    case "csv":
      return FileSpreadsheetIcon
    case "ppt":
    case "pptx":
      return FilePresentationIcon
    default:
      return FileIcon
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function getFileType(file: FileItem): string {
  const extension = file.name.split(".").pop()?.toLowerCase() || ""
  return extension
}
