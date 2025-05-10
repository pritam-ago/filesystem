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
    const { key, isFolder } = body

    // Forward the request to the backend server
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/files/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user.token}`,
      },
      body: JSON.stringify({ key, isFolder }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to delete item")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Something went wrong" },
      { status: 500 }
    )
  }
}
