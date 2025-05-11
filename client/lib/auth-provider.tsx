"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { UserType } from "@/lib/types"
import { getApiUrl } from "./api-config"

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
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setUser(null)
          setIsLoading(false)
          return
        }

        const response = await fetch(getApiUrl("/auth/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch user")
        }

        const data = await response.json()
        setUser(data)
      } catch (error) {
        console.error("Auth check failed:", error)
        localStorage.removeItem("token")
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(getApiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error("Login failed")
      }

      const data = await response.json()
      localStorage.setItem("token", data.token)
      setUser(data.user)
      return data
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const signup = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch(getApiUrl("/auth/signup"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      })

      if (!response.ok) {
        throw new Error("Signup failed")
      }

      const data = await response.json()
      localStorage.setItem("token", data.token)
      setUser(data.user)
      return data
    } catch (error) {
      console.error("Signup failed:", error)
      throw error
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
