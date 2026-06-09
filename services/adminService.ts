// ========================================================
// ADMIN SERVICE
// ========================================================
// Handles all admin-related API calls.
// All endpoints require ADMIN role.
// ========================================================

import apiClient from "@/api/client"
import { mockDashboardStatsService } from "@/services/mockDashboardStatsService"
import { mockRegisteredUsersService } from "@/services/mockRegisteredUsersService"
import { mockTrustFraudService } from "@/services/mockTrustFraudService"
import { mockDisputeService } from "@/services/mockDisputeService"
import { mockVerificationService } from "@/services/mockVerificationService"

// Use mock API flag
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true"

// ========================================================
// TYPE DEFINITIONS
// ========================================================

export interface DashboardStats {
  totalUsers: number
  totalTransactions: number
  pendingDisputes: number
  pendingCnicVerifications: number
  highRiskUsers: number
  totalListings?: number
  verifiedUsers?: number
  completedTransactions?: number
  recentActivity?: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: string
  description: string
  timestamp: string
  userId?: string
  userName?: string
}

export interface AdminUser {
  id: string
  username: string
  email: string
  role: "USER" | "ADMIN"
  status: "ACTIVE" | "SUSPENDED"
  verified: boolean
  fraudScore: number
  trustRating: number
  createdAt: string
  lastActive?: string
  disputeCount?: number
  successfulTransactions?: number
}

export interface PlatformStats {
  totalUsers: number
  activeUsers: number
  suspendedUsers: number
  totalTransactions: number
  completedTransactions: number
  disputedTransactions: number
  totalListings: number
  activeListings: number
  verifiedUsers: number
  pendingVerifications: number
  totalRevenue?: number
  fraudAlerts: number
}

export interface HighRiskUser {
  id: string
  username: string
  email: string
  fraudScore: number
  trustRating: number
  flaggedReason: string
  flaggedAt: string
  status: "ACTIVE" | "SUSPENDED"
}

export interface Dispute {
  id: string
  transactionId: string
  raisedBy: string
  raisedByName?: string
  reason: string
  status: "PENDING" | "IN_REVIEW" | "RESOLVED" | "ESCALATED"
  resolution?: string
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
  amount?: number
}

export interface CnicVerification {
  verificationId: string
  userId: string
  userName?: string
  userEmail?: string
  cnicNumber?: string
  extractedName?: string
  frontImageUrl?: string
  backImageUrl?: string
  overallStatus: "PENDING" | "VERIFIED" | "REJECTED"
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}

// ========================================================
// ADMIN SERVICE IMPLEMENTATION
// ========================================================

export const adminService = {
  // GET /admin/dashboard
  getDashboard: async (): Promise<{ data: DashboardStats }> => {
    if (USE_MOCK) {
      const stats = await mockDashboardStatsService.getAllStats()
      return {
        data: {
          totalUsers: stats.data.totalUsers,
          totalTransactions: stats.data.totalTransactions,
          pendingDisputes: stats.data.disputes.pending,
          pendingCnicVerifications: stats.data.pendingVerifications,
          highRiskUsers: stats.data.fraudAlerts,
          totalListings: stats.data.totalListings,
          verifiedUsers: stats.data.verifiedUsers,
          completedTransactions: stats.data.completedTransactions,
        },
      }
    }

    const response = await apiClient.get<DashboardStats>("/admin/dashboard")
    return { data: response.data }
  },

  // GET /admin/users
  getAllUsers: async (params?: { page?: number; size?: number }): Promise<{ data: { content: AdminUser[]; totalElements: number } }> => {
    if (USE_MOCK) {
      const result = await mockRegisteredUsersService.getAllUsers(params)
      return {
        data: {
          content: result.data.content as AdminUser[],
          totalElements: result.data.totalElements,
        },
      }
    }

    const response = await apiClient.get("/admin/users", { params })
    return { data: response.data }
  },

  // GET /admin/users/{id}
  getUserById: async (id: string): Promise<{ data: AdminUser }> => {
    if (USE_MOCK) {
      const result = await mockRegisteredUsersService.getUserById(id)
      return { data: result.data as AdminUser }
    }

    const response = await apiClient.get<AdminUser>(`/admin/users/${id}`)
    return { data: response.data }
  },

  // GET /admin/stats
  getStats: async (): Promise<{ data: PlatformStats }> => {
    if (USE_MOCK) {
      const stats = await mockDashboardStatsService.getAllStats()
      return {
        data: {
          totalUsers: stats.data.totalUsers,
          activeUsers: stats.data.totalUsers - 1,
          suspendedUsers: 1,
          totalTransactions: stats.data.totalTransactions,
          completedTransactions: stats.data.completedTransactions,
          disputedTransactions: stats.data.disputes.total,
          totalListings: stats.data.totalListings,
          activeListings: stats.data.activeListings,
          verifiedUsers: stats.data.verifiedUsers,
          pendingVerifications: stats.data.pendingVerifications,
          fraudAlerts: stats.data.fraudAlerts,
        },
      }
    }

    const response = await apiClient.get<PlatformStats>("/admin/stats")
    return { data: response.data }
  },

  // GET /admin/disputes
  getAllDisputes: async (): Promise<{ data: Dispute[] }> => {
    if (USE_MOCK) {
      const result = await mockDisputeService.getAllDisputes()
      return { data: result.data as Dispute[] }
    }

    const response = await apiClient.get<Dispute[]>("/admin/disputes")
    return { data: response.data }
  },

  // GET /admin/users/high-risk
  getHighRiskUsers: async (): Promise<{ data: HighRiskUser[] }> => {
    if (USE_MOCK) {
      const result = await mockTrustFraudService.getHighRiskUsers()
      return { data: result.data as HighRiskUser[] }
    }

    const response = await apiClient.get<HighRiskUser[]>("/admin/users/high-risk")
    return { data: response.data }
  },

  // POST /admin/suspend-user/{userId}
  suspendUser: async (userId: string): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      await mockTrustFraudService.suspendUser(userId)
      await mockRegisteredUsersService.updateUserStatus(userId, "SUSPENDED")
      return { data: { message: "User suspended successfully" } }
    }

    const response = await apiClient.post(`/admin/suspend-user/${userId}`)
    return { data: response.data }
  },

  // Unsuspend user (custom endpoint)
  unsuspendUser: async (userId: string): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      await mockTrustFraudService.unsuspendUser(userId)
      await mockRegisteredUsersService.updateUserStatus(userId, "ACTIVE")
      return { data: { message: "User unsuspended successfully" } }
    }

    const response = await apiClient.post(`/admin/unsuspend-user/${userId}`)
    return { data: response.data }
  },

  // GET /admin/cnic/pending
  getPendingVerifications: async (): Promise<{ data: CnicVerification[] }> => {
    if (USE_MOCK) {
      const result = await mockVerificationService.getPendingVerifications()
      return { data: result.data as CnicVerification[] }
    }

    const response = await apiClient.get<CnicVerification[]>("/admin/cnic/pending")
    return { data: response.data }
  },

  // GET /admin/cnic/all
  getAllVerifications: async (): Promise<{ data: CnicVerification[] }> => {
    if (USE_MOCK) {
      const result = await mockVerificationService.getAllVerifications()
      return { data: result.data as CnicVerification[] }
    }

    const response = await apiClient.get<CnicVerification[]>("/admin/cnic/all")
    return { data: response.data }
  },

  // POST /admin/cnic/{id}/approve
  approveVerification: async (id: string, remarks?: string): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      await mockVerificationService.approveVerification(id, remarks)
      return { data: { message: "Verification approved successfully" } }
    }

    const response = await apiClient.post(`/admin/cnic/${id}/approve`, { remarks })
    return { data: response.data }
  },

  // POST /admin/cnic/{id}/reject
  rejectVerification: async (id: string, reason: string, remarks?: string): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      await mockVerificationService.rejectVerification(id, reason, remarks)
      return { data: { message: "Verification rejected" } }
    }

    const response = await apiClient.post(`/admin/cnic/${id}/reject`, { reason, remarks })
    return { data: response.data }
  },
}

export default adminService
