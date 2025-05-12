import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication",
  description: "Authentication pages for Folder Gumbo",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 