import { FileItem, FolderItem } from "@/lib/types"
import { getApiUrl } from "./api-config"

interface UploadProgress {
  loaded: number;
  total: number;
  fileIndex: number;
}

interface UploadResult {
  uploadId: string;
  key: string;
}

interface ChunkUploadResult {
  ETag: string;
  PartNumber: number;
}

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

  static async uploadFiles(
    files: File[],
    folder?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<any[]> {
    const results: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const totalChunks = Math.ceil(file.size / chunkSize);
      const parts: Array<{ ETag: string; PartNumber: number }> = [];

      // Initialize upload
      const initResponse = await fetch(`${getApiUrl("/files/upload/initiate")}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          folder
        })
      });

      if (!initResponse.ok) {
        throw new Error('Failed to initialize upload');
      }

      const { uploadId, key } = await initResponse.json() as UploadResult;

      // Upload chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('uploadId', uploadId);
        formData.append('key', key);
        formData.append('partNumber', String(chunkIndex + 1));
        formData.append('chunk', chunk);

        const chunkResponse = await fetch(`${getApiUrl("/files/upload/chunk")}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          },
          body: formData
        });

        if (!chunkResponse.ok) {
          const errorData = await chunkResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to upload chunk');
        }

        const chunkResult = await chunkResponse.json() as ChunkUploadResult;
        parts.push({
          ETag: chunkResult.ETag,
          PartNumber: chunkResult.PartNumber
        });

        // Update progress
        if (onProgress) {
          const loaded = (chunkIndex + 1) * chunkSize;
          onProgress({
            loaded: Math.min(loaded, file.size),
            total: file.size,
            fileIndex: i
          });
        }
      }

      // Complete upload
      const completeResponse = await fetch(`${getApiUrl("/files/upload/complete")}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          uploadId,
          key,
          parts
        })
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to complete upload');
      }

      results.push(await completeResponse.json());
    }

    return results;
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
        method: "POST",
        headers: this.getHeaders(),
        credentials: "include",
        body: JSON.stringify({ key, isFolder }),
      });

      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        // Try to get error message from response, but don't assume it's JSON
        let errorMessage = "Failed to delete file or folder";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Only try to parse JSON if response is OK
      const responseData = await response.json();
      console.log('Delete response data:', responseData);
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
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ key, isFolder: false }),
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