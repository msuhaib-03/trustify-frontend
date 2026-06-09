"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Spinner } from "@/components/ui/spinner"

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] ProtectedRoute - Auth State:", { 
      isLoading, 
      isAuthenticated, 
      isAdmin, 
      adminOnly,
      userRole: user?.role 
    })
    
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log("[v0] ProtectedRoute - Not authenticated, redirecting to /login")
        router.push("/login")
      } else if (adminOnly && !isAdmin) {
        console.log("[v0] ProtectedRoute - Not admin, redirecting to /home")
        router.push("/home")
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, adminOnly, router, user?.role])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || (adminOnly && !isAdmin)) {
    return null
  }

  return <>{children}</>
}
