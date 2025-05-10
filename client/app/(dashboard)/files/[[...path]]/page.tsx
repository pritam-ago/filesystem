import type { Metadata } from "next"
import { FileManager } from "@/components/file-manager/file-manager"

export const metadata: Metadata = {
  title: "Files",
  description: "Manage your files and folders",
}

export default function FilesPage({
  params,
}: {
  params: { path?: string[] }
}) {
  const path = params.path ? params.path.map(decodeURIComponent).join("/") : ""

  return <FileManager initialPath={path} />
}
