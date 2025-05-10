"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileManagerHeader } from "./file-manager-header"
import { FileManagerBreadcrumb } from "./file-manager-breadcrumb"
import { FileManagerContent } from "./file-manager-content"
import { FileManagerEmptyState } from "./file-manager-empty-state"
import { FileManagerUploadProgress } from "./file-manager-upload-progress"
import { useFileManager } from "@/lib/file-manager-provider"
import { useToast } from "@/components/ui/use-toast"
import type { FileItem } from "@/lib/types"

interface FileManagerProps {
  initialPath?: string
}

export function FileManager({ initialPath = "" }: FileManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const {
    currentPath,
    setCurrentPath,
    files,
    folders,
    isLoading,
    isUploading,
    uploadProgress,
    fetchFiles,
    createFolder,
    uploadFiles,
    deleteItem,
    downloadFile,
    downloadFolder,
    renameItem,
  } = useFileManager()

  useEffect(() => {
    setCurrentPath(initialPath)
    fetchFiles(initialPath)
  }, [initialPath, fetchFiles, setCurrentPath])

  const handleNavigate = (path: string) => {
    router.push(`/files/${path}`)
  }

  const handleCreateFolder = async (folderName: string) => {
    try {
      await createFolder(folderName, currentPath)
      toast({
        title: "Folder created",
        description: `Folder "${folderName}" has been created successfully.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create folder. Please try again.",
      })
    }
  }

  const handleUploadFiles = async (files: File[]) => {
    try {
      // currentPath should be relative to the user's root (e.g., 'documents', not 'users/{userId}/documents')
      await uploadFiles(files, currentPath)
      toast({
        title: "Files uploaded",
        description: `${files.length} file(s) have been uploaded successfully.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload files. Please try again.",
      })
    }
  }

  const handleDeleteItem = async (key: string, isFolder: boolean) => {
    try {
      await deleteItem(key, isFolder)
      toast({
        title: "Item deleted",
        description: `${isFolder ? "Folder" : "File"} has been deleted successfully.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete item. Please try again.",
      })
    }
  }

  const handleDownloadFile = async (file: FileItem) => {
    try {
      await downloadFile(file)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download file. Please try again.",
      })
    }
  }

  const handleDownloadFolder = async (folder: string) => {
    try {
      await downloadFolder(folder)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download folder. Please try again.",
      })
    }
  }

  const handleRenameItem = async (key: string, newName: string, isFolder: boolean) => {
    try {
      await renameItem(key, newName, isFolder)
      toast({
        title: "Item renamed",
        description: `${isFolder ? "Folder" : "File"} has been renamed successfully.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to rename item. Please try again.",
      })
    }
  }

  return (
    <div className="flex h-full flex-col">
      <FileManagerHeader
        currentPath={currentPath}
        onNavigate={handleNavigate}
        onCreateFolder={handleCreateFolder}
        onUploadFiles={handleUploadFiles}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />
      <FileManagerBreadcrumb path={currentPath} onNavigate={handleNavigate} />
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading files...</p>
          </div>
        </div>
      ) : files.length === 0 && folders.length === 0 ? (
        <FileManagerEmptyState onUploadFiles={handleUploadFiles} onCreateFolder={handleCreateFolder} />
      ) : (
        <FileManagerContent
          files={files}
          folders={folders}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onDeleteItem={handleDeleteItem}
          onDownloadFile={handleDownloadFile}
          onDownloadFolder={handleDownloadFolder}
          onRenameItem={handleRenameItem}
          onUploadFiles={handleUploadFiles}
        />
      )}
    </div>
  )
}
