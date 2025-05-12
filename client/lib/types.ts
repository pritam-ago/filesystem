export interface UserType {
  id: string
  username: string
  email: string
}

export interface FileItem {
  key: string
  name: string
  size: number
  lastModified: Date
  type?: string
  url?: string
  thumbnailUrl?: string
}

export interface FolderItem {
  name: string
  key: string
  size: number
  lastModified: Date
}

export interface FileOperation {
  type: "delete" | "rename"
  items: (FileItem | FolderItem)[]
  newName?: string
}
