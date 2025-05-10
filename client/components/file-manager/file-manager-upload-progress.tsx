"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface FileManagerUploadProgressProps {
  progress: number
}

export function FileManagerUploadProgress({ progress }: FileManagerUploadProgressProps) {
  return (
    <div className="fixed bottom-4 right-4 w-80 rounded-lg border bg-background p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Uploading files</h4>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      <div className="mt-2">
        <Progress value={progress} className="h-2" />
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{progress.toFixed(0)}%</span>
        <span>{progress === 100 ? "Complete" : "Uploading..."}</span>
      </div>
    </div>
  )
}
