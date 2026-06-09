"use client"

import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BackButtonProps {
  fallbackUrl?: string
  className?: string
}

export function BackButton({ fallbackUrl = "/", className }: BackButtonProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Hide back button on home page - this is the initial landing page after login
  if (pathname === "/home") {
    return null
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackUrl)
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleBack} className={className}>
      <ArrowLeft className="h-5 w-5" />
      <span className="sr-only">Go back</span>
    </Button>
  )
}
