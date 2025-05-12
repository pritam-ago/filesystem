import { NextResponse } from "next/server"
import { SignJWT } from "jose"

// In a real application, you would use a proper secret key
const JWT_SECRET = new TextEncoder().encode("your-secret-key")

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // In a real application, you would validate the credentials against a database

    // For demo purposes, we'll just create a token
    const userId = "user_" + Math.random().toString(36).substring(2, 9)
    const username = email.split("@")[0]

    const token = await new SignJWT({
      id: userId,
      email,
      username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(JWT_SECRET)

    return NextResponse.json({
      token,
      user: {
        id: userId,
        username,
        email,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
  }
}
