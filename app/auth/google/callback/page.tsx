"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Shield } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"

function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { googleLogin } = useAuth()

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      toast.error("Google authentication failed")
      router.push("/login")
      return
    }

    if (code) {
      const redirectUri = `${window.location.origin}/auth/google/callback`

      googleLogin(code, redirectUri)
        .then(() => {
          toast.success("Successfully logged in with Google!")
          router.push("/home")
        })
        .catch((err) => {
          console.error("Google login error:", err)
          toast.error("Failed to authenticate with Google")
          router.push("/login")
        })
    } else {
      router.push("/login")
    }
  }, [searchParams, googleLogin, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent mx-auto">
          <Shield className="h-8 w-8 text-primary-foreground" />
        </div>
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Completing Google authentication...</p>
      </div>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  )
}
