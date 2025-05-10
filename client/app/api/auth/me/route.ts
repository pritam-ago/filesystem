import { NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { headers } from "next/headers"

// In a real application, you would use a proper secret key
const JWT_SECRET = new TextEncoder().encode("your-secret-key")

export async function GET() {
  try {
    const headersList = headers()
    const authorization = headersList.get("authorization")

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authorization.split(" ")[1]

    const { payload } = await jwtVerify(token, JWT_SECRET)

    return NextResponse.json({
      user: {
        id: payload.id as string,
        username: payload.username as string,
        email: payload.email as string,
      },
    })
  } catch (error) {
    console.error("Auth verification error:", error)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
}
