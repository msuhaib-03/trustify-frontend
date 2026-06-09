import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import {
  mockAuthAPI,
  mockAdminAPI,
  mockUserAPI,
  mockListingAPI,
  mockTransactionAPI,
  mockChatAPI,
  mockApi,
} from "./mock-api"

// ========================================================
// API CONFIGURATION
// ========================================================
// Set USE_MOCK_API to false when backend is ready
// Environment variable: NEXT_PUBLIC_USE_MOCK_API=false
// ========================================================

const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false" // Default to true for development

// Base API URL - Configure in environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"

// Debug: Log API configuration (only in browser, once)
if (typeof window !== "undefined") {
  console.log("[v0] API Mode:", USE_MOCK_API ? "MOCK" : "REAL")
  console.log("[v0] API Base URL:", API_BASE_URL)
}

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
})

// Endpoints that must NOT carry an auth token (public auth flows)
const NO_AUTH_ENDPOINTS = ["/auth/forgot-password", "/auth/reset-password"]

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      const isPublicAuthEndpoint = NO_AUTH_ENDPOINTS.some((ep) => config.url?.includes(ep))
      if (token && config.headers && !isPublicAuthEndpoint) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log network errors for debugging
    if (error.code === "ERR_NETWORK") {
      console.error("[API] Network Error - Backend may be unreachable or CORS issue:", {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        message: error.message,
      })
    }
    
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export const authAPI = USE_MOCK_API
  ? mockAuthAPI
  : {
      signup: (data: { username: string; email: string; password: string }) => api.post("/auth/signup", data),
      login: (data: { email: string; password: string }) => api.post("/auth/login", data),
      validate: () => api.get("/auth/validate"),
      googleCallback: (code: string, redirectUri: string) =>
        api.get(`/auth/google/callback?code=${code}&redirect_uri=${redirectUri}`),
      forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
      resetPassword: (token: string, newPassword: string) => api.post("/auth/reset-password", { token, newPassword }),
    }

export const adminAPI = USE_MOCK_API
  ? mockAdminAPI
  : {
      // Dashboard
      dashboard: () => api.get("/admin/dashboard"),
      stats: () => api.get("/admin/stats"),
      
      // User Management
      getAllUsers: (params?: { page?: number; size?: number }) => api.get("/admin/users", { params }),
      getUserById: (id: string) => api.get(`/admin/users/${id}`),
      suspendUser: (userId: string) => api.post(`/admin/suspend-user/${userId}`),
      activateUser: (userId: string) => api.post(`/admin/activate-user/${userId}`),
      getHighRiskUsers: () => api.get("/admin/users/high-risk"),
      
      // Disputes
      getAllDisputes: (params?: { status?: string }) => api.get("/admin/disputes", { params }),
      resolveDispute: (disputeId: string, data: { action: string; resolution: string; refundAmountCents?: number }) =>
        api.post(`/admin/disputes/${disputeId}/resolve`, data),
      
      // CNIC Verification
      getPendingCnic: () => api.get("/admin/cnic/pending"),
      getAllCnic: () => api.get("/admin/cnic/all"),
      approveCnic: (id: string, remarks?: string) => api.post(`/admin/cnic/${id}/approve`, { remarks }),
      rejectCnic: (id: string, reason: string, remarks?: string) => api.post(`/admin/cnic/${id}/reject`, { reason, remarks }),

      // Dashboard live widgets
      getSystemHealth: () => api.get("/admin/system-health"),
      getMonthlyRevenue: () => api.get("/admin/revenue/monthly"),
      getRecentActivity: (limit = 10) => api.get(`/admin/activity/recent?limit=${limit}`),
    }

export const userAPI = USE_MOCK_API
  ? mockUserAPI
  : {
      getAll: (params?: { page?: number; size?: number }) => api.get("/users/all", { params }),
      getById: (id: string) => api.get(`/users/${id}`),
      getProfile: () => api.get("/users/profile"),
      updateProfile: (data: { username?: string; profileImage?: string }) => api.put("/users/profile", data),
      updatePassword: (newPassword: string) => api.put("/users/me/password", { newPassword }),
    }

export const listingAPI = USE_MOCK_API
  ? mockListingAPI
  : {
      create: (formData: FormData) =>
        api.post("/listings/create", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      // Note: /listings endpoint returns ListingDTO without id field (backend bug)
      // Use getRent + getSale to get full Listing objects with id
      getAll: (params?: { page?: number; size?: number; sortBy?: string; sortDir?: string }) =>
        api.get("/listings", { params }),
      getById: (id: string) => api.get(`/listings/${id}`),
      delete: (id: string) => api.delete(`/listings/${id}`),
      toggleFavorite: (listingId: string) => api.post(`/listings/${listingId}/favorite`),
      // Get current user's listings - returns full Listing objects with ID
      getMine: (params?: { page?: number; size?: number; sortBy?: string; sortDir?: string }) =>
        api.get("/listings/mine", { params }),
      // Get user's favorites - returns ListingDTO (backend should add id field)
      getFavorites: () => api.get("/listings/favorites"),
      // These endpoints return full Listing objects WITH id field - use these for browsing
      getRent: (params?: { page?: number; size?: number; sortBy?: string; sortDir?: string }) =>
        api.get("/listings/rent", { params }),
      getSale: (params?: { page?: number; size?: number; sortBy?: string; sortDir?: string }) =>
        api.get("/listings/sell", { params }),
      // Combined method to get all listings with IDs by fetching both rent and sale
      getAllWithIds: async (params?: { page?: number; size?: number; sortBy?: string; sortDir?: string }) => {
        const [rentResponse, saleResponse] = await Promise.all([
          api.get("/listings/rent", { params }),
          api.get("/listings/sell", { params }),
        ])
        // Combine and return both arrays
        const allListings = [...(rentResponse.data || []), ...(saleResponse.data || [])]
        return { data: allListings }
      },
    }

export const transactionAPI = USE_MOCK_API
  ? mockTransactionAPI
  : {
      // Create transaction - matches backend CreateTransactionRequest
      create: (data: { 
        listingId: string; 
        buyerId: string;
        sellerId: string;
        amountCents: number;
        depositCents?: number;
        currency?: string;
        type: "SALE" | "RENT";
      }) => api.post("/transactions", data),
      getById: (id: string) => api.get(`/transactions/${id}`),
      getAll: (params?: { page?: number; size?: number; userId?: string }) => api.get("/transactions", { params }),
      acceptConditions: (id: string, userId: string) => 
        api.post(`/transactions/${id}/accept-conditions?userId=${userId}`),
      requestRelease: (id: string, note?: string) => api.post(`/transactions/${id}/request-release`, { note }),
      confirmRelease: (id: string, amountToCaptureCents?: number) =>
        api.post(`/transactions/${id}/confirm-release`, { amountToCaptureCents }),
      refund: (id: string, amountCents?: number) =>
        api.post(`/transactions/${id}/refund${amountCents ? `?amountCents=${amountCents}` : ""}`),
      dispute: (id: string, data: { reason: string; evidence?: string }) => 
        api.post(`/transactions/${id}/dispute`, data),
      adminResolveDispute: (id: string, data: { decision: string; deductionCents?: number; notes?: string }) =>
        api.post(`/transactions/${id}/admin/resolve-dispute`, data),
      getAdminStats: () => api.get("/admin/transactions/stats"),
      getAdminTransactions: (params?: { page?: number; size?: number }) => api.get("/admin/transactions", { params }),
      // Rental-specific actions
      startRental: (id: string) => api.post(`/transactions/${id}/start-rental`),
      completeRental: (id: string) => api.post(`/transactions/${id}/complete-rental`),
      deductDamage: (id: string, damageAmountCents: number) =>
        api.post(`/transactions/${id}/deduct-damage?damageAmountCents=${damageAmountCents}`),
      finalizeRefund: (id: string) => api.post(`/transactions/${id}/finalize-refund`),
    }

export const chatAPI = USE_MOCK_API
  ? mockChatAPI
  : {
      create: (participants: string[]) => api.post("/chats", { participants }),
      sendMessage: (chatId: string, data: { senderId: string; content: string }) =>
        api.post(`/chats/${chatId}/messages`, data),
      getMessages: (chatId: string, params?: { page?: number; size?: number }) =>
        api.get(`/chats/${chatId}/messages`, { params }),
      getUserChats: (userId: string, params?: { page?: number; size?: number }) =>
        api.get("/chats", { params: { userId, ...params } }),
      markAsRead: (chatId: string, userId: string) => api.post(`/chats/${chatId}/read?userId=${userId}`),
      getSummaries: (userId: string, params?: { page?: number; size?: number }) =>
        api.get("/chats/summaries", { params: { userId, ...params } }),
    }

// Category Security Deposit Config — admin only
export const depositConfigAPI = {
  getAll: () => api.get("/admin/deposit-config"),
  updateAll: (configs: { category: string; depositPercentage: number }[]) =>
    api.put("/admin/deposit-config", configs),
}

// Fraud Detection APIs (Mock for now - will be replaced with real backend)
export const fraudAPI = {
  analyzeTransaction: (transactionId: string) => api.post(`/fraud/analyze/${transactionId}`),
  getUserRiskScore: (userId: string) => api.get(`/fraud/user-risk/${userId}`),
  getListingRisk: (listingId: string) => api.get(`/fraud/listing-risk/${listingId}`),
  getFraudReports: (params?: { page?: number; size?: number }) => api.get("/fraud/reports", { params }),
  flagUser: (userId: string, reason: string) => api.post(`/fraud/flag-user/${userId}`, { reason }),
}

// CNIC Verification APIs
export const cnicAPI = USE_MOCK_API
  ? {
      submit: async (data: { 
        frontImage: File; 
        backImage: File; 
      }) => {
        // Mock implementation - import from service
        const { mockVerificationService } = await import("@/services/mockVerificationService")
        return mockVerificationService.submitVerification(data)
      },
      getMyStatus: async () => {
        const { mockVerificationService } = await import("@/services/mockVerificationService")
        return mockVerificationService.getUserVerification()
      },
      isVerified: async () => {
        const { mockVerificationService } = await import("@/services/mockVerificationService")
        return mockVerificationService.isCurrentUserVerified()
      },
    }
  : {
      submit: (data: { 
        frontImage: File; 
        backImage: File; 
      }) => {
        const formData = new FormData()
        formData.append("frontImage", data.frontImage)
        formData.append("backImage", data.backImage)
        
        // Use fetch instead of axios to properly handle multipart/form-data
        // axios has issues with overriding default Content-Type headers
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        return fetch(`${API_BASE_URL}/cnic-verification/submit`, {
          method: "POST",
          headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            // Don't set Content-Type - browser will set it with proper boundary for FormData
          },
          body: formData,
        }).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
          }
          const data = await response.json()
          return { data }
        })
      },
      getMyStatus: () => api.get("/cnic-verification/my-status"),
      // isVerified should use my-status and check the status field
      isVerified: async () => {
        try {
          const response = await api.get("/cnic-verification/my-status")
          const status = response.data?.status
          // APPROVED status means user is verified
          return { data: { verified: status === "APPROVED" } }
        } catch {
          // If no verification record exists, user is not verified
          return { data: { verified: false } }
        }
      },
    }

// Dispute APIs
export const disputeAPI = USE_MOCK_API
  ? {
      getAll: async (params?: { status?: string }) => {
        const { mockDisputeService } = await import("@/services/mockDisputeService")
        return mockDisputeService.getAllDisputes(params)
      },
      getStats: async () => {
        const { mockDisputeService } = await import("@/services/mockDisputeService")
        return mockDisputeService.getStats()
      },
      resolve: async (disputeId: string, data: { action: string; resolution: string; refundAmountCents?: number }) => {
        const { mockDisputeService } = await import("@/services/mockDisputeService")
        return mockDisputeService.resolve(disputeId, data)
      },
      create: async (data: {
        transactionId: string;
        listingId: string;
        listingTitle: string;
        sellerId: string;
        sellerName: string;
        amountCents: number;
        reason: string;
        message: string;
      }) => {
        const { mockDisputeService } = await import("@/services/mockDisputeService")
        return mockDisputeService.create(data)
      },
    }
  : {
      getAll: (params?: { status?: string }) => api.get("/disputes", { params }),
      getStats: () => api.get("/disputes/stats"),
      resolve: (disputeId: string, data: { action: string; resolution: string; refundAmountCents?: number }) =>
        api.post(`/admin/disputes/${disputeId}/resolve`, data),
      create: (data: {
        transactionId: string;
        listingId: string;
        listingTitle: string;
        sellerId: string;
        sellerName: string;
        amountCents: number;
        reason: string;
        message: string;
      }) => api.post("/disputes", data),
    }

// Feedback APIs
export const feedbackAPI = USE_MOCK_API
  ? {
      getAll: async (params?: { page?: number; size?: number; status?: string }) => {
        const { mockFeedbackService } = await import("@/services/mockFeedbackService")
        return mockFeedbackService.getAllFeedback(params)
      },
      getUserFeedback: async () => {
        const { mockFeedbackService } = await import("@/services/mockFeedbackService")
        return mockFeedbackService.getUserFeedback()
      },
      getStats: async () => {
        const { mockFeedbackService } = await import("@/services/mockFeedbackService")
        return mockFeedbackService.getStats()
      },
      updateStatus: async (feedbackId: string, status: string) => {
        const { mockFeedbackService } = await import("@/services/mockFeedbackService")
        return mockFeedbackService.updateStatus(feedbackId, status)
      },
      submit: async (data: { feedbackType: string; title: string; message: string; rating?: number | null }) => {
        const { mockFeedbackService } = await import("@/services/mockFeedbackService")
        return mockFeedbackService.submit(data)
      },
    }
  : {
      getAll: (params?: { page?: number; size?: number; status?: string }) => api.get("/feedback", { params }),
      getUserFeedback: () => api.get("/feedback/user"),
      getStats: () => api.get("/feedback/stats"),
      updateStatus: (feedbackId: string, status: string) => api.put(`/feedback/${feedbackId}/status`, { status }),
      submit: (data: { feedbackType: string; title: string; message: string; rating?: number | null }) => api.post("/feedback", data),
    }

// User Profile / Trust APIs
export const trustAPI = USE_MOCK_API
  ? {
      getCurrentUserTrustProfile: async () => {
        const { mockTrustFraudService } = await import("@/services/mockTrustFraudService")
        return mockTrustFraudService.getCurrentUserTrustProfile()
      },
      getUserTrustProfile: async (userId: string) => {
        const { mockTrustFraudService } = await import("@/services/mockTrustFraudService")
        return mockTrustFraudService.getUserTrustProfile(userId)
      },
      getAllUsers: async (params?: { page?: number; size?: number }) => {
        const { mockTrustFraudService } = await import("@/services/mockTrustFraudService")
        return mockTrustFraudService.getAllTrustFraudUsers(params)
      },
      getHighRiskUsers: async () => {
        const { mockTrustFraudService } = await import("@/services/mockTrustFraudService")
        return mockTrustFraudService.getHighRiskUsers()
      },
      getStats: async () => {
        const { mockTrustFraudService } = await import("@/services/mockTrustFraudService")
        return mockTrustFraudService.getStats()
      },
    }
  : {
      getCurrentUserTrustProfile: () => api.get("/trust/profile"),
      getUserTrustProfile: (userId: string) => api.get(`/trust/profile/${userId}`),
      getAllUsers: (params?: { page?: number; size?: number }) => api.get("/trust/users", { params }),
      getHighRiskUsers: () => api.get("/trust/users/high-risk"),
      getStats: () => api.get("/trust/stats"),
    }

// Timeline APIs
export const timelineAPI = USE_MOCK_API
  ? {
      getTransactionTimeline: async (transactionId: string) => {
        const { timelineService } = await import("@/services/timelineService")
        return timelineService.getTransactionTimeline(transactionId)
      },
    }
  : {
      getTransactionTimeline: (transactionId: string) => api.get(`/timeline/${transactionId}`),
    }

export { mockApi }

// Export USE_MOCK_API flag for other modules
export const isMockMode = () => USE_MOCK_API

export default USE_MOCK_API ? mockApi : api
