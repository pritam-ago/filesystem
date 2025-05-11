"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

const PUBLIC_PATHS = ["/", "/login", "/signup"]

export function InitialAuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      const isPublicPath = PUBLIC_PATHS.includes(pathname)

      if (token && isPublicPath) {
        router.replace("/files")
      } else if (!token && !isPublicPath) {
        router.replace("/login")
      } else {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 