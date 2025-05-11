import { NextResponse } from "next/server"
import { getApiUrl } from "@/lib/api-config"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    const token = request.headers.get("authorization")?.split(" ")[1]

    if (!key) {
      return NextResponse.json(
        { error: "Key is required" },
        { status: 400 }
      )
    }

    const response = await fetch(getApiUrl(`/files/signed-url?key=${encodeURIComponent(key)}`), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get signed URL")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error getting signed URL:", error)
    return NextResponse.json(
      { error: "Failed to get signed URL" },
      { status: 500 }
    )
  }
}
