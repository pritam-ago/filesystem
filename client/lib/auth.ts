import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import type { UserType } from "@/lib/types"

// In a real application, you would use a proper secret key
const JWT_SECRET = "your-secret-key"

export async function getCurrentUser(): Promise<UserType | null> {
  const cookieStore = cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string
      email: string
      username: string
    }

    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
    }
  } catch (error) {
    return null
  }
}
