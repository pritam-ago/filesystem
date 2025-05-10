import { headers } from "next/headers"
import { jwtVerify } from "jose"
import type { UserType } from "@/lib/types"

// In a real application, you would use a proper secret key
const JWT_SECRET = new TextEncoder().encode("your-secret-key")

export async function verifyAuth(): Promise<UserType | null> {
  const headersList = headers()
  const authorization = headersList.get("authorization")

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null
  }

  const token = authorization.split(" ")[1]

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    return {
      id: payload.id as string,
      username: payload.username as string,
      email: payload.email as string,
    }
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}
