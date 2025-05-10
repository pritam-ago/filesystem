"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileIcon, HomeIcon, ImageIcon, VideoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 flex-col border-r bg-background md:flex">
      <div className="flex h-14 items-center border-b px-4 py-2">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <FileIcon className="h-5 w-5" />
          <span>File Manager</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          <Button variant={pathname === "/files" ? "secondary" : "ghost"} className="w-full justify-start" asChild>
            <Link href="/files">
              <HomeIcon className="mr-2 h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button
            variant={pathname === "/files/documents" ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href="/files/documents">
              <FileIcon className="mr-2 h-4 w-4" />
              Documents
            </Link>
          </Button>
          <Button
            variant={pathname === "/files/images" ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href="/files/images">
              <ImageIcon className="mr-2 h-4 w-4" />
              Images
            </Link>
          </Button>
          <Button
            variant={pathname === "/files/videos" ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <Link href="/files/videos">
              <VideoIcon className="mr-2 h-4 w-4" />
              Videos
            </Link>
          </Button>
        </div>
      </nav>
    </aside>
  )
}
