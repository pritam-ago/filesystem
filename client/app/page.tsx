"use client"

import { Button } from "@/components/ui/button"
import { FileIcon } from "lucide-react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function Welcome() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center border-b px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <FileIcon className="h-5 w-5" />
            <span>Folder Gumbo</span>
          </Link>
        </header>
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Welcome to Folder Gumbo
                  </h1>
                  <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                    Your all-in-one solution for file management and organization. Store, share, and collaborate with ease.
                  </p>
                </div>
                <div className="space-x-4">
                  <Link href="/login">
                    <Button variant="outline" size="lg">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="lg">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </AuthGuard>
  )
}
