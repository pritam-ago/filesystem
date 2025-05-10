import { FileItem, FolderItem } from "@/lib/types"

const API_URL = "http://localhost:3000/api"

export class FileService {
  private static getHeaders(): HeadersInit {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  }

  static async listFiles(prefix?: string): Promise<{ folders: FolderItem[]; files: FileItem[] }> {
    const url = new URL(`${API_URL}/files/list`)
    if (prefix) {
      url.searchParams.append("prefix", prefix)
    }

    const response = await fetch(url.toString(), {
      headers: this.getHeaders(),
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to list files")
    }

    return response.json()
  }

  static async uploadFiles(files: File[], folder?: string): Promise<any> {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append("files", file)
    })
    if (folder) {
      formData.append("folder", folder)
    }

    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to upload files")
    }

    return response.json()
  }

  static async createFolder(folderPath: string, currentFolder?: string): Promise<void> {
    const response = await fetch(`${API_URL}/files/folder`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify({ folderPath, currentFolder }),
    })

    if (!response.ok) {
      throw new Error("Failed to create folder")
    }
  }

  static async deleteFileOrFolder(key: string, isFolder: boolean): Promise<void> {
    const response = await fetch(`${API_URL}/files`, {
      method: "DELETE",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify({ key, isFolder }),
    })

    if (!response.ok) {
      throw new Error("Failed to delete item")
    }
  }

  static async getSignedUrl(key: string): Promise<string> {
    const url = new URL(`${API_URL}/files/url`)
    url.searchParams.append("key", key)

    const response = await fetch(url.toString(), {
      headers: this.getHeaders(),
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to get signed URL")
    }

    const data = await response.json()
    return data.url
  }

  static async copyFiles(keys: string[], targetFolder: string): Promise<void> {
    const response = await fetch(`${API_URL}/files/copy`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify({ keys, targetFolder }),
    })

    if (!response.ok) {
      throw new Error("Failed to copy files")
    }
  }

  static async moveFiles(keys: string[], targetFolder: string): Promise<void> {
    const response = await fetch(`${API_URL}/files/move`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify({ keys, targetFolder }),
    })

    if (!response.ok) {
      throw new Error("Failed to move files")
    }
  }

  static async renameFileOrFolder(key: string, newName: string, isFolder: boolean): Promise<void> {
    const response = await fetch(`${API_URL}/files/rename`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify({ key, newName, isFolder }),
    })

    if (!response.ok) {
      throw new Error("Failed to rename item")
    }
  }

  static async downloadFolder(folder: string): Promise<Blob> {
    const response = await fetch(`${API_URL}/files/download/${folder}`, {
      headers: this.getHeaders(),
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to download folder")
    }

    return response.blob()
  }
} 