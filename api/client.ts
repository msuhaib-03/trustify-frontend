// ========================================================
// CENTRALIZED API CLIENT
// ========================================================
// This is the main Axios client for all API calls.
// It handles JWT authentication, error handling, and
// provides a clean interface for all services.
// ========================================================

import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"
const REQUEST_TIMEOUT = 30000

// Error types for proper handling
export interface ApiError {
  status: number
  message: string
  code?: string
  details?: Record<string, unknown>
}

// Create the main axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Set to true if backend requires credentials
})

// ========================================================
// REQUEST INTERCEPTOR
// ========================================================
// Automatically attaches JWT token to all requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")

      const url = config.url || ""

      // ❌ DO NOT attach token to public endpoints
      const publicRoutes = [
        "/auth/login",
        "/auth/signup"
      ]

      const isPublicRoute = publicRoutes.some(route =>
        url.includes(route)
      )

      if (token && config.headers && !isPublicRoute) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // optional safety cleanup
      if (!token && config.headers) {
        delete config.headers.Authorization
      }
    }

    return config
  },
  (error) => {
    console.error("[API Client] Request error:", error)
    return Promise.reject(error)
  }
)
// ========================================================
// RESPONSE INTERCEPTOR
// ========================================================
// Handles common error scenarios:
// - 401 Unauthorized: Clears session and redirects to login
// - 403 Forbidden: Access denied error
// - 404 Not Found: Resource not found
// - 500 Server Error: Backend error
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string }>) => {
    const status = error.response?.status

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message

    if (typeof window !== "undefined") {
      if (status === 401 || status === 403) {
        localStorage.removeItem("token")
        localStorage.removeItem("user")

        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login"
        }
      }
    }

    const apiError: ApiError = {
      status: status || 0,
      message: message || "An unexpected error occurred",
    }

    return Promise.reject(apiError)
  }
)
// ========================================================
// API CLIENT HELPERS
// ========================================================

// Helper for multipart/form-data requests (file uploads)
export const uploadFile = async (endpoint: string, formData: FormData) => {
  return apiClient.post(endpoint, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
}

// Helper to check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    await apiClient.get("/health", { timeout: 5000 })
    return true
  } catch {
    return false
  }
}

// Get base URL for debugging
export const getApiBaseUrl = () => API_BASE_URL

export default apiClient
