import { NextResponse } from "next/server"
import { getApiUrl } from "@/lib/api-config"

export async function DELETE(request: Request) {
  try {
    const { key } = await request.json()
    const token = request.headers.get("authorization")?.split(" ")[1]

    const response = await fetch(getApiUrl("/files/delete"), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ key }),
    })

    if (!response.ok) {
      throw new Error("Failed to delete file")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    )
  }
}
