"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { FileService } from "./file-service"
import type { FileItem, FolderItem } from "./types"

interface FileManagerContextType {
  currentPath: string
  setCurrentPath: (path: string) => void
  files: FileItem[]
  folders: FolderItem[]
  isLoading: boolean
  isUploading: boolean
  uploadProgress: UploadProgress[]
  viewMode: "list" | "grid"
  setViewMode: (mode: "list" | "grid") => void
  fetchFiles: (prefix?: string) => Promise<void>
  createFolder: (folderPath: string, currentFolder?: string) => Promise<void>
  uploadFiles: (files: File[], folder?: string) => Promise<void>
  deleteItem: (key: string, isFolder: boolean) => Promise<void>
  downloadFile: (file: FileItem) => Promise<void>
  downloadFolder: (folder: string) => Promise<void>
  renameItem: (key: string, newName: string, isFolder: boolean) => Promise<void>
}

interface UploadProgress {
  fileName: string;
  progress: number;
  total: number;
  loaded: number;
}

const FileManagerContext = createContext<FileManagerContextType>({
  currentPath: "",
  setCurrentPath: () => {},
  files: [],
  folders: [],
  isLoading: false,
  isUploading: false,
  uploadProgress: [],
  viewMode: "list",
  setViewMode: () => {},
  fetchFiles: async () => {},
  createFolder: async () => {},
  uploadFiles: async () => {},
  deleteItem: async () => {},
  downloadFile: async () => {},
  downloadFolder: async () => {},
  renameItem: async () => {},
})

export function FileManagerProvider({ children }: { children: React.ReactNode }) {
  const [currentPath, setCurrentPath] = useState("")
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  const fetchFiles = useCallback(async (prefix?: string) => {
    setIsLoading(true)
    try {
      const { files: newFiles, folders: newFolders } = await FileService.listFiles(prefix)
      setFiles(newFiles)
      setFolders(newFolders)
    } catch (error) {
      console.error("Error fetching files:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createFolder = useCallback(async (folderPath: string, currentFolder?: string) => {
    await FileService.createFolder(folderPath, currentFolder)
    await fetchFiles(currentPath)
  }, [currentPath, fetchFiles])

  const uploadFiles = async (files: File[], folder?: string) => {
    try {
      setIsUploading(true);
      setUploadProgress([]);

      // Initialize progress for each file
      const initialProgress: UploadProgress[] = files.map(file => ({
        fileName: file.name,
        progress: 0,
        total: file.size,
        loaded: 0
      }));
      setUploadProgress(initialProgress);

      await FileService.uploadFiles(files, folder, (progress) => {
        setUploadProgress(prev => {
          const newProgress = [...prev];
          newProgress[progress.fileIndex] = {
            ...newProgress[progress.fileIndex],
            progress: (progress.loaded / progress.total) * 100,
            loaded: progress.loaded,
            total: progress.total
          };
          return newProgress;
        });
      });

      // Refresh the file list after upload
      await fetchFiles(currentPath);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress([]);
    }
  };

  const deleteItem = useCallback(async (key: string, isFolder: boolean) => {
    await FileService.deleteFileOrFolder(key, isFolder)
    await fetchFiles(currentPath)
  }, [currentPath, fetchFiles])

  const downloadFile = useCallback(async (file: FileItem) => {
    await FileService.downloadFile(file.key)
  }, [])

  const downloadFolder = useCallback(async (folder: string) => {
    const blob = await FileService.downloadFolder(folder)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${folder}.zip`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, [])

  const renameItem = useCallback(async (key: string, newName: string, isFolder: boolean) => {
    await FileService.renameFileOrFolder(key, newName, isFolder)
    await fetchFiles(currentPath)
  }, [currentPath, fetchFiles])

  return (
    <FileManagerContext.Provider
      value={{
        currentPath,
        setCurrentPath,
        files,
        folders,
        isLoading,
        isUploading,
        uploadProgress,
        viewMode,
        setViewMode,
        fetchFiles,
        createFolder,
        uploadFiles,
        deleteItem,
        downloadFile,
        downloadFolder,
        renameItem,
      }}
    >
      {children}
    </FileManagerContext.Provider>
  )
}

export const useFileManager = () => useContext(FileManagerContext)
