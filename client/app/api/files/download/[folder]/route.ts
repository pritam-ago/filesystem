import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth-utils"

export async function GET(request: Request, { params }: { params: { folder: string } }) {
  try {
    // Verify authentication
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const folder = params.folder

    // In a real application, you would generate a zip file of the folder contents
    // and return it as a stream
    // For demo purposes, we'll just return a mock response

    // Create a mock response with a Content-Disposition header
    return new NextResponse("Mock zip file content", {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${folder}.zip"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
