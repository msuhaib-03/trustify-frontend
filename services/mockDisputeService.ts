// ========================================================
// MOCK DISPUTE SERVICE (localStorage-based)
// ========================================================
// This service simulates the dispute system with localStorage
// as a mock database. It will be replaced with real Spring Boot
// APIs later.
//
// All function signatures and responses MATCH the real backend
// APIs exactly to ensure seamless transition.
// ========================================================

import { mockTransactionService } from "./mockTransactionService"

export interface Dispute {
  disputeId: string
  transactionId: string
  listingId: string
  listingTitle: string
  buyerId: string
  buyerName: string
  sellerId: string
  sellerName: string
  amountCents: number
  reason: string
  message: string
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED"
  resolution?: string
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = "mock_disputes"
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper to generate unique IDs
const generateId = (prefix = "dsp") => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Get all disputes from localStorage
const getDisputesFromStorage = (): Dispute[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("[Mock Dispute Service] Error reading from localStorage:", error)
    return []
  }
}

// Save disputes to localStorage
const saveDisputesToStorage = (disputeList: Dispute[]) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(disputeList))
  } catch (error) {
    console.error("[Mock Dispute Service] Failed to save to localStorage:", error)
  }
}

// ========================================================
// MOCK DISPUTE API IMPLEMENTATIONS
// ========================================================

export const mockDisputeService = {
  // 1. CREATE DISPUTE (User)
  // REAL API (to be enabled later): POST /api/disputes
  // axios.post('/api/disputes', data)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  create: async (data: {
    transactionId: string
    listingId: string
    listingTitle: string
    sellerId: string
    sellerName: string
    amountCents: number
    reason: string
    message: string
  }) => {
    await delay(600)

    // Get current user from localStorage
    const userStored = localStorage.getItem("user")
    const currentUser = userStored ? JSON.parse(userStored) : { id: "mock-user", username: "Mock User" }

    const newDispute: Dispute = {
      disputeId: generateId("dsp"),
      transactionId: data.transactionId,
      listingId: data.listingId,
      listingTitle: data.listingTitle,
      buyerId: currentUser.id || currentUser.email || "unknown",
      buyerName: currentUser.username || currentUser.name || "Unknown User",
      sellerId: data.sellerId,
      sellerName: data.sellerName,
      amountCents: data.amountCents,
      reason: data.reason,
      message: data.message,
      status: "OPEN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const disputeList = getDisputesFromStorage()
    disputeList.push(newDispute)
    saveDisputesToStorage(disputeList)

    return {
      data: {
        message: "Dispute created successfully",
        dispute: newDispute,
      },
    }
  },

  // 2. GET USER'S DISPUTES
  // REAL API (to be enabled later): GET /api/disputes/user
  // axios.get('/api/disputes/user')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getUserDisputes: async () => {
    await delay(400)

    const userStored = localStorage.getItem("user")
    const currentUser = userStored ? JSON.parse(userStored) : { id: "mock-user" }

    const disputeList = getDisputesFromStorage()
    const userDisputes = disputeList.filter(
      (d) =>
        d.buyerId === currentUser.id ||
        d.buyerId === currentUser.email ||
        d.sellerId === currentUser.id ||
        d.sellerId === currentUser.email,
    )

    // Sort by createdAt desc
    userDisputes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return {
      data: {
        content: userDisputes,
        totalElements: userDisputes.length,
      },
    }
  },

  // 3. GET ALL DISPUTES (Admin)
  // REAL API (to be enabled later): GET /api/admin/disputes
  // axios.get('/api/admin/disputes', { params })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getAllDisputes: async (params?: { page?: number; size?: number; status?: string }) => {
    await delay(400)

    let disputeList = getDisputesFromStorage()

    // Filter by status if provided
    if (params?.status && params.status !== "all") {
      disputeList = disputeList.filter((d) => d.status === params.status)
    }

    // Sort by createdAt desc
    disputeList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const page = params?.page || 0
    const size = params?.size || 20
    const start = page * size
    const end = start + size
    const paginatedDisputes = disputeList.slice(start, end)

    return {
      data: {
        content: paginatedDisputes,
        totalElements: disputeList.length,
        totalPages: Math.ceil(disputeList.length / size),
        currentPage: page,
      },
    }
  },

  // 4. GET DISPUTE BY ID (Admin)
  // REAL API (to be enabled later): GET /api/admin/disputes/{id}
  // axios.get(`/api/admin/disputes/${id}`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getById: async (id: string) => {
    await delay(300)

    const disputeList = getDisputesFromStorage()
    const dispute = disputeList.find((d) => d.disputeId === id)

    if (!dispute) {
      throw new Error("Dispute not found")
    }

    return { data: dispute }
  },

  // 5. GET DISPUTE BY TRANSACTION ID
  // REAL API (to be enabled later): GET /api/disputes/transaction/{transactionId}
  // axios.get(`/api/disputes/transaction/${transactionId}`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getByTransactionId: async (transactionId: string) => {
    await delay(300)

    const disputeList = getDisputesFromStorage()
    const dispute = disputeList.find((d) => d.transactionId === transactionId)

    return { data: dispute || null }
  },

  // 6. UPDATE DISPUTE STATUS (Admin)
  // REAL API (to be enabled later): PUT /api/admin/disputes/{id}/status
  // axios.put(`/api/admin/disputes/${id}/status`, { status, resolution })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  updateStatus: async (id: string, status: Dispute["status"], resolution?: string) => {
    await delay(500)

    const disputeList = getDisputesFromStorage()
    const index = disputeList.findIndex((d) => d.disputeId === id)

    if (index === -1) {
      throw new Error("Dispute not found")
    }

    disputeList[index] = {
      ...disputeList[index],
      status,
      resolution: resolution || disputeList[index].resolution,
      resolvedBy: status === "RESOLVED" || status === "CLOSED" ? "admin" : undefined,
      resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    }

    saveDisputesToStorage(disputeList)

    return {
      data: {
        message: "Dispute status updated successfully",
        dispute: disputeList[index],
      },
    }
  },

  // 7. RESOLVE DISPUTE (Admin) - with action
  // REAL API (to be enabled later): POST /api/admin/disputes/{id}/resolve
  // axios.post(`/api/admin/disputes/${id}/resolve`, { action, resolution, refundAmountCents })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  resolve: async (
    id: string,
    data: {
      action: "refund_buyer" | "release_to_seller" | "partial_refund"
      resolution: string
      refundAmountCents?: number
    },
  ) => {
    await delay(700)

    const disputeList = getDisputesFromStorage()
    const index = disputeList.findIndex((d) => d.disputeId === id)

    if (index === -1) {
      throw new Error("Dispute not found")
    }

    let resolutionText = data.resolution
    if (!resolutionText) {
      switch (data.action) {
        case "refund_buyer":
          resolutionText = "Full refund issued to buyer"
          break
        case "release_to_seller":
          resolutionText = "Funds released to seller"
          break
        case "partial_refund":
          resolutionText = `Partial refund of Rs. ${((data.refundAmountCents || 0) / 100).toFixed(2)} issued to buyer`
          break
      }
    }

    // Update dispute status to RESOLVED
    disputeList[index] = {
      ...disputeList[index],
      status: "RESOLVED",
      resolution: resolutionText,
      resolvedBy: "admin",
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    saveDisputesToStorage(disputeList)

    const transactionId = disputeList[index].transactionId
    if (transactionId) {
      try {
        // Determine transaction status based on resolution action
        let transactionStatus: "COMPLETED" | "REFUNDED" = "COMPLETED"
        if (data.action === "refund_buyer") {
          transactionStatus = "REFUNDED"
        } else if (data.action === "partial_refund") {
          transactionStatus = "REFUNDED"
        } else if (data.action === "release_to_seller") {
          transactionStatus = "COMPLETED"
        }

        // Update transaction using mockTransactionService's adminResolveDispute
        await mockTransactionService.adminResolveDispute(transactionId, {
          resolution: resolutionText,
          amountCents: data.refundAmountCents,
        })

        console.log("[Mock Dispute Service] Transaction synchronized:", transactionId, "→", transactionStatus)
      } catch (txnError) {
        console.error("[Mock Dispute Service] Failed to sync transaction:", txnError)
        // Continue even if transaction sync fails - dispute is still resolved
      }
    }

    return {
      data: {
        message: "Dispute resolved successfully",
        dispute: disputeList[index],
        action: data.action,
        refundAmountCents: data.refundAmountCents,
      },
    }
  },

  // 8. GET DISPUTE STATS (Admin)
  // REAL API (to be enabled later): GET /api/admin/disputes/stats
  // axios.get('/api/admin/disputes/stats')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getStats: async () => {
    await delay(300)

    const disputeList = getDisputesFromStorage()

    const totalCount = disputeList.length
    const openCount = disputeList.filter((d) => d.status === "OPEN").length
    const underReviewCount = disputeList.filter((d) => d.status === "UNDER_REVIEW").length
    const resolvedCount = disputeList.filter((d) => d.status === "RESOLVED").length
    const closedCount = disputeList.filter((d) => d.status === "CLOSED").length
    const totalValueCents = disputeList.reduce((sum, d) => sum + d.amountCents, 0)

    return {
      data: {
        totalDisputes: totalCount,
        openDisputes: openCount,
        underReviewDisputes: underReviewCount,
        resolvedDisputes: resolvedCount,
        closedDisputes: closedCount,
        totalDisputedValue: totalValueCents,
      },
    }
  },

  // Helper: Clear all disputes (for testing)
  clearAll: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
    }
  },
}

export default mockDisputeService
