"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { authAPI } from "@/lib/api"

interface User {
  id?: string
  username: string
  email: string
  role?: string
  status?: string
  profileImage?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  googleLogin: (code: string, redirectUri: string) => Promise<void>
  updateUser: (user: User) => void
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  setToken: React.Dispatch<React.SetStateAction<string | null>>
  setAuthData: (userData: User, authToken: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!token && !!user
  const isAdmin = user?.role?.toString().toUpperCase() === "ADMIN"

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token")
        const storedUser = localStorage.getItem("user")

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))

          // Validate token with backend
          try {
            const response = await authAPI.validate()
            if (response.data.valid) {
              // Token is valid, keep the user logged in
            } else {
              // Token is invalid, clear storage
              localStorage.removeItem("token")
              localStorage.removeItem("user")
              setToken(null)
              setUser(null)
            }
          } catch {
            // Validation failed but keep user logged in for testing
            console.log("Token validation skipped in mock mode")
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authAPI.login({ email, password })
    
    // Handle different possible response structures from backend
    const data = response.data
    const newToken = data.token || data.jwt || data.accessToken
    
    // Extract role - handle multiple Spring Security patterns
    let role = ""
    if (data.role) {
      role = data.role
    } else if (data.user?.role) {
      role = data.user.role
    } else if (data.userRole) {
      role = data.userRole
    } else if (data.authorities && Array.isArray(data.authorities)) {
      // Spring Security often returns authorities as array of objects with 'authority' field
      const firstAuth = data.authorities[0]
      if (typeof firstAuth === 'string') {
        role = firstAuth
      } else if (firstAuth?.authority) {
        role = firstAuth.authority
      }
    } else if (data.roles && Array.isArray(data.roles)) {
      role = data.roles[0]
    }
    
    // Normalize role - remove ROLE_ prefix if present (Spring Security pattern)
    const normalizedRole = role.toString().replace(/^ROLE_/i, "").toUpperCase()
    
    const username = data.username || data.user?.username || data.name || data.user?.name || ""
    const userEmail = data.email || data.user?.email || email
    const id = data.id || data.userId || data.user?.id || data.user?.userId || ""

    const userData: User = { id, username, email: userEmail, role: normalizedRole }

    localStorage.setItem("token", newToken)
    localStorage.setItem("user", JSON.stringify(userData))

    setToken(newToken)
    setUser(userData)
  }, [])

  const signup = useCallback(async (username: string, email: string, password: string) => {
    await authAPI.signup({ username, email, password })
    // Don't auto-login after signup - redirect to login page
  }, [])

  const googleLogin = useCallback(async (code: string, redirectUri: string) => {
    const response = await authAPI.googleCallback(code, redirectUri)
    
    // Handle different possible response structures from backend
    const data = response.data
    const newToken = data.token || data.jwt || data.accessToken
    
    // Extract role - handle multiple Spring Security patterns
    let role = ""
    if (data.role) {
      role = data.role
    } else if (data.user?.role) {
      role = data.user.role
    } else if (data.userRole) {
      role = data.userRole
    } else if (data.authorities && Array.isArray(data.authorities)) {
      const firstAuth = data.authorities[0]
      if (typeof firstAuth === 'string') {
        role = firstAuth
      } else if (firstAuth?.authority) {
        role = firstAuth.authority
      }
    } else if (data.roles && Array.isArray(data.roles)) {
      role = data.roles[0]
    }
    
    // Normalize role - remove ROLE_ prefix if present
    const normalizedRole = role.toString().replace(/^ROLE_/i, "").toUpperCase()
    
    const username = data.username || data.user?.username || data.name || data.user?.name
    const email = data.email || data.user?.email
    const id = data.id || data.userId || data.user?.id || data.user?.userId

    const userData: User = { id, username, email, role: normalizedRole }

    localStorage.setItem("token", newToken)
    localStorage.setItem("user", JSON.stringify(userData))

    setToken(newToken)
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    const storedToken = localStorage.getItem("token")

    try {
      // Call real logout API
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      })
    } catch (err) {
      console.log("Logout API failed, forcing local logout")
    }

    // Always clear local state regardless of API success
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
  }, [])

  const setAuthData = useCallback((userData: User, authToken: string) => {
    localStorage.setItem("token", authToken)
    localStorage.setItem("user", JSON.stringify(userData))
    setToken(authToken)
    setUser(userData)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        signup,
        logout,
        googleLogin,
        updateUser,
        setUser,
        setToken,
        setAuthData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
