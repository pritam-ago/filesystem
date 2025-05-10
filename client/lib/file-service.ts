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
    try {
      console.log('Sending delete request:', { key, isFolder });
      const response = await fetch(`${API_URL}/files/delete`, {
        method: "POST",
        headers: this.getHeaders(),
        credentials: "include",
        body: JSON.stringify({ key, isFolder }),
      });

      console.log('Delete response status:', response.status);
      const responseData = await response.json();
      console.log('Delete response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to delete file or folder");
      }
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  }

  static async getSignedUrl(key: string): Promise<string> {
    const response = await fetch(`${API_URL}/files/signed-url?key=${encodeURIComponent(key)}`, {
      headers: this.getHeaders(),
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to get signed URL")
    }

    const data = await response.json()
    return data.url
  }

  static async downloadFolder(folder: string): Promise<Blob> {
    const url = `${API_URL}/files/download/${encodeURIComponent(folder)}`.replace(/([^:]\/)\/+/, "$1");
    const response = await fetch(url, {
      headers: this.getHeaders(),
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to download folder")
    }

    return response.blob()
  }

  static async downloadFile(key: string): Promise<void> {
    const url = `${API_URL}/files/download-file?key=${encodeURIComponent(key)}`.replace(/([^:]\/)\/+/, "$1");
    const response = await fetch(url, {
      headers: this.getHeaders(),
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error("Failed to download file");
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = key.split('/').pop() || "file";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  }

  static async renameFileOrFolder(key: string, newName: string, isFolder: boolean): Promise<void> {
    const response = await fetch(`${API_URL}/files/rename`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: JSON.stringify({ key, newName, isFolder }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to rename item");
    }
  }
} 