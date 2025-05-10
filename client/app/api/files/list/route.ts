import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    // Verify authentication
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get the prefix from the query parameters
    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get("prefix") || ""

    // In a real application, you would fetch files and folders from a database or storage service
    // For demo purposes, we'll return mock data
    const mockFolders = prefix ? [`${prefix}/documents`, `${prefix}/images`] : ["documents", "images", "videos"]

    const mockFiles = [
      {
        key: `${prefix ? prefix + "/" : ""}file1.pdf`,
        name: "file1.pdf",
        size: 1024 * 1024 * 2, // 2MB
        lastModified: new Date().toISOString(),
      },
      {
        key: `${prefix ? prefix + "/" : ""}file2.jpg`,
        name: "file2.jpg",
        size: 1024 * 512, // 512KB
        lastModified: new Date().toISOString(),
      },
      {
        key: `${prefix ? prefix + "/" : ""}file3.docx`,
        name: "file3.docx",
        size: 1024 * 256, // 256KB
        lastModified: new Date().toISOString(),
      },
    ]

    return NextResponse.json({
      folders: mockFolders,
      files: mockFiles,
    })
  } catch (error) {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
