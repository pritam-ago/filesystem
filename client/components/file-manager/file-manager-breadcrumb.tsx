"use client"

import { ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileManagerBreadcrumbProps {
  path: string
  onNavigate: (path: string) => void
}

export function FileManagerBreadcrumb({ path, onNavigate }: FileManagerBreadcrumbProps) {
  const segments = path ? path.split("/") : []

  return (
    <div className="flex items-center gap-1 overflow-x-auto p-4 text-sm">
      <Button variant="ghost" size="sm" className="h-8 flex items-center" onClick={() => onNavigate("")}>
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Button>
      {segments.length > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      {segments.map((segment, index) => {
        const segmentPath = segments.slice(0, index + 1).join("/")
        const isLast = index === segments.length - 1

        return (
          <div key={segmentPath} className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 ${isLast ? "font-medium" : ""}`}
              onClick={() => onNavigate(segmentPath)}
            >
              {decodeURIComponent(segment)}
            </Button>
            {!isLast && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        )
      })}
    </div>
  )
}
