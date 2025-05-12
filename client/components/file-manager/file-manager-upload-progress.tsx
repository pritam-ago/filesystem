"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UploadProgress {
  fileName: string;
  progress: number;
  total: number;
  loaded: number;
}

interface FileManagerUploadProgressProps {
  uploadProgress: UploadProgress[];
}

export function FileManagerUploadProgress({ uploadProgress }: FileManagerUploadProgressProps) {
  // Calculate total progress
  const totalProgress = uploadProgress.reduce((acc, curr) => acc + curr.progress, 0) / uploadProgress.length;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span>Overall Progress</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>

        <ScrollArea className="h-32">
          <div className="space-y-4">
            {uploadProgress.map((file, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="truncate max-w-[200px]">{file.fileName}</span>
                  <span>{Math.round(file.progress)}%</span>
                </div>
                <Progress value={file.progress} className="h-2" />
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
