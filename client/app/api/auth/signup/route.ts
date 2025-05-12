import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, email, password } = body

    // In a real application, you would validate the input and hash the password
    // before storing it in a database

    // For demo purposes, we'll just return a success response
    return NextResponse.json({
      message: "User created successfully",
      userId: "user_" + Math.random().toString(36).substring(2, 9),
      username,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}
