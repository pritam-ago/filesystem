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
  type: string
}

export interface FolderItem {
  key: string
  name: string
  lastModified: Date
}

export interface FileOperation {
  type: "copy" | "move" | "delete" | "rename"
  items: (FileItem | FolderItem)[]
  targetFolder?: string
  newName?: string
}
