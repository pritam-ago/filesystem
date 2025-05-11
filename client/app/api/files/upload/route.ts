import { NextResponse } from "next/server"
import { getApiUrl } from "@/lib/api-config"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folderPath = formData.get("folderPath") as string
    const token = request.headers.get("authorization")?.split(" ")[1]

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      )
    }

    const response = await fetch(getApiUrl("/files/upload"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload file")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
