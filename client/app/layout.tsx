import React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "../components/theme-provider"
import { AuthProvider } from "../lib/auth-provider"
import { Toaster } from "../components/ui/toaster"
import { InitialAuthCheck } from "../components/auth/initial-auth-check"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Folder Gumbo",
  description: "A modern file management system with authentication",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <InitialAuthCheck>
              {children}
            </InitialAuthCheck>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
