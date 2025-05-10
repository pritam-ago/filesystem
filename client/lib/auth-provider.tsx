"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { UserType } from "@/lib/types"

interface AuthContextType {
  user: UserType | null
  login: (email: string, password: string) => Promise<void>
  signup: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const response = await fetch("http://localhost:3000/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
          })

          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
          } else {
            // Token is invalid or expired
            localStorage.removeItem("token")
            router.push("/login")
          }
        } catch (error) {
          console.error("Error fetching user:", error)
          localStorage.removeItem("token")
          router.push("/login")
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Invalid credentials")
      }

      const data = await response.json()
      localStorage.setItem("token", data.token)
      setUser(data.user)
      router.push("/files")
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message)
      }
      throw new Error("Invalid credentials")
    }
  }

  const signup = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch("http://localhost:3000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ username, email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create account")
      }

      await response.json()
      // We don't automatically log in the user after signup
      router.push("/login")
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message)
      }
      throw new Error("Failed to create account")
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
