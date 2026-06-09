// ========================================================
// AUTHENTICATION SERVICE
// ========================================================
// Handles all authentication-related API calls.
// Supports both real backend and mock mode for development.
// ========================================================

import apiClient from "@/api/client"
import { mockRegisteredUsersService } from "@/services/mockRegisteredUsersService"

// Use mock API flag - set to false when backend is ready
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true"

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  username: string
  email: string
  role: "USER" | "ADMIN"
  id: string
}

export interface User {
  id: string
  username: string
  email: string
  role: "USER" | "ADMIN"
  status?: "ACTIVE" | "SUSPENDED"
  verified?: boolean
  fraudScore?: number
  trustRating?: number
}

// ========================================================
// AUTH SERVICE IMPLEMENTATION
// ========================================================

export const authService = {
  // POST /auth/login
  login: async (data: LoginRequest): Promise<{ data: AuthResponse }> => {
    if (USE_MOCK) {
      // Use mock validation
      const result = await mockRegisteredUsersService.validateCredentials(data.email, data.password)
      if (!result.success) {
        const error = new Error(result.message) as Error & { code?: string }
        error.code = result.errorCode
        throw error
      }
      return {
        data: {
          token: result.user!.role === "ADMIN" ? "mock-admin-jwt-token" : "mock-jwt-token",
          username: result.user!.username,
          email: result.user!.email,
          role: result.user!.role,
          id: result.user!.id,
        },
      }
    }

    // Real API call
    const response = await apiClient.post<AuthResponse>("/auth/login", data)
    return { data: response.data }
  },

  // POST /auth/signup
  signup: async (data: SignupRequest): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      const result = await mockRegisteredUsersService.createUser(data)
      return { data: { message: result.data.message } }
    }

    const response = await apiClient.post("/auth/signup", data)
    return { data: response.data }
  },

  // GET /auth/validate - Validate current JWT token
  validate: async (): Promise<{ data: User }> => {
    if (USE_MOCK) {
      // Mock validation - check localStorage
      const userStr = localStorage.getItem("user")
      if (!userStr) throw new Error("Not authenticated")
      return { data: JSON.parse(userStr) }
    }

    const response = await apiClient.get<User>("/auth/validate")
    return { data: response.data }
  },

  // Google OAuth callback
  googleCallback: async (code: string, redirectUri: string): Promise<{ data: AuthResponse }> => {
    if (USE_MOCK) {
      throw new Error("Google OAuth not available in mock mode")
    }

    const response = await apiClient.get<AuthResponse>(
      `/auth/google/callback?code=${code}&redirect_uri=${redirectUri}`
    )
    return { data: response.data }
  },

  // Logout - Clear local storage
  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false
    return !!localStorage.getItem("token")
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    if (typeof window === "undefined") return null
    const userStr = localStorage.getItem("user")
    return userStr ? JSON.parse(userStr) : null
  },

  // Check if current user is admin
  isAdmin: (): boolean => {
    const user = authService.getCurrentUser()
    return user?.role === "ADMIN"
  },
}

export default authService
