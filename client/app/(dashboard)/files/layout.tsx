import type React from "react"
import { FileManagerProvider } from "@/lib/file-manager-provider"

export default function FilesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <FileManagerProvider>{children}</FileManagerProvider>
}
