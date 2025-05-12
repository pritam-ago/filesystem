import { Progress } from "./progress"
import { Card, CardContent } from "./card"

interface UploadProgressProps {
  progress: number
  fileName: string
  totalFiles?: number
  currentFile?: number
}

export function UploadProgress({
  progress,
  fileName,
  totalFiles = 1,
  currentFile = 1,
}: UploadProgressProps) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{fileName}</span>
            <span className="text-muted-foreground">
              {totalFiles > 1 ? `File ${currentFile} of ${totalFiles}` : ""}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{Math.round(progress)}%</span>
            <span>Uploading...</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 