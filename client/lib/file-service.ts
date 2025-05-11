import { FileItem, FolderItem } from "@/lib/types"
import { getApiUrl } from "./api-config"

export class FileService {
  private static getHeaders(): HeadersInit {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  }

  static async listFiles(prefix?: string): Promise<{ folders: FolderItem[]; files: FileItem[] }> {
    const url = new URL(`${getApiUrl("/files/list")}`)
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
    const response = await fetch(getApiUrl("/files/upload"), {
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
    const response = await fetch(getApiUrl("/files/folder"), {
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
      const response = await fetch(getApiUrl("/files/delete"), {
        method: "DELETE",
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
    const response = await fetch(getApiUrl(`/files/signed-url?key=${encodeURIComponent(key)}`), {
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
    const url = `${getApiUrl("/files/download")}/${encodeURIComponent(folder)}`.replace(/([^:]\/)\/+/, "$1");
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
    const url = `${getApiUrl("/files/download-file")}?key=${encodeURIComponent(key)}`.replace(/([^:]\/)\/+/, "$1");
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
    const response = await fetch(getApiUrl("/files/rename"), {
      method: "PUT",
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

export async function uploadFile(file: File, folderId?: string) {
  const formData = new FormData()
  formData.append("file", file)
  if (folderId) {
    formData.append("folderId", folderId)
  }

  const response = await fetch(getApiUrl("/files/upload"), {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to upload file")
  }

  return response.json()
}

export async function createFolder(name: string, parentId?: string) {
  const response = await fetch(getApiUrl("/files/folder"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ name, parentId }),
  })

  if (!response.ok) {
    throw new Error("Failed to create folder")
  }

  return response.json()
}

export async function deleteFile(key: string) {
  const response = await fetch(getApiUrl("/files/delete"), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ key }),
  })

  if (!response.ok) {
    throw new Error("Failed to delete file")
  }

  return response.json()
}

export async function getSignedUrl(key: string) {
  const response = await fetch(getApiUrl(`/files/signed-url?key=${encodeURIComponent(key)}`), {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to get signed URL")
  }

  return response.json()
}

export async function renameFile(key: string, newName: string) {
  const response = await fetch(getApiUrl("/files/rename"), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ key, newName }),
  })

  if (!response.ok) {
    throw new Error("Failed to rename file")
  }

  return response.json()
} 