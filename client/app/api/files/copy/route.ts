import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    // Verify authentication
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { keys, targetFolder } = body

    // In a real application, you would copy the files to the target folder in a storage service
    // For demo purposes, we'll just return a success response

    const copiedFiles = keys.map((key) => {
      const name = key.split("/").pop()
      return {
        key: `${targetFolder}/${name}`,
        name,
      }
    })

    return NextResponse.json({
      message: "Files copied successfully",
      copiedFiles,
    })
  } catch (error) {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
