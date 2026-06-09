// ========================================================
// TRANSACTION SERVICE
// ========================================================
// Handles all transaction-related API calls including
// escrow, rentals, disputes, and refunds.
// ========================================================

import apiClient from "@/api/client"
import { mockTransactionService } from "@/services/mockTransactionService"

// Use mock API flag
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true"

// ========================================================
// TYPE DEFINITIONS
// ========================================================

export type TransactionStatus =
  | "PENDING"
  | "ESCROW_HELD"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DISPUTED"
  | "REFUNDED"
  | "CANCELLED"

export type TransactionType = "SALE" | "RENT"

export interface Transaction {
  id: string
  listingId: string
  listingTitle?: string
  buyerId: string
  buyerName?: string
  sellerId: string
  sellerName?: string
  amount: number
  status: TransactionStatus
  type: TransactionType
  createdAt: string
  updatedAt?: string
  completedAt?: string
  escrowId?: string
  disputeReason?: string
  disputeStatus?: string
  rentalStartDate?: string
  rentalEndDate?: string
  damageCharges?: number
}

export interface CreateTransactionRequest {
  listingId: string
  amountCents: number
  type?: TransactionType
  rentalStartDate?: string
  rentalEndDate?: string
}

export interface DisputeRequest {
  reason: string
  message: string
}

export interface ResolveDisputeRequest {
  resolution: string
  amountCents?: number
}

// ========================================================
// TRANSACTION SERVICE IMPLEMENTATION
// ========================================================

export const transactionService = {
  // POST /transactions - Create new transaction
  create: async (data: CreateTransactionRequest): Promise<{ data: Transaction }> => {
    if (USE_MOCK) {
      const result = await mockTransactionService.createTransaction({
        listingId: data.listingId,
        amount: data.amountCents / 100,
        type: data.type || "SALE",
      })
      return { data: result.data.transaction as Transaction }
    }

    const response = await apiClient.post<Transaction>("/transactions", data)
    return { data: response.data }
  },

  // GET /transactions/{id}
  getById: async (id: string): Promise<{ data: Transaction }> => {
    if (USE_MOCK) {
      const result = await mockTransactionService.getTransactionById(id)
      return { data: result.data as Transaction }
    }

    const response = await apiClient.get<Transaction>(`/transactions/${id}`)
    return { data: response.data }
  },

  // GET /transactions - Get all transactions for current user
  getAll: async (params?: { page?: number; size?: number; userId?: string }): Promise<{ data: { content: Transaction[]; totalElements: number } }> => {
    if (USE_MOCK) {
      const result = await mockTransactionService.getAllTransactions(params)
      return {
        data: {
          content: result.data.content as Transaction[],
          totalElements: result.data.totalElements,
        },
      }
    }

    const response = await apiClient.get("/transactions", { params })
    return { data: response.data }
  },

  // POST /transactions/{id}/accept-conditions
  acceptConditions: async (id: string): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      await mockTransactionService.updateTransactionStatus(id, "ESCROW_HELD")
      return { data: { message: "Conditions accepted" } }
    }

    const response = await apiClient.post(`/transactions/${id}/accept-conditions`)
    return { data: response.data }
  },

  // POST /transactions/{id}/start-rental
  startRental: async (id: string): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      await mockTransactionService.updateTransactionStatus(id, "IN_PROGRESS")
      return { data: { message: "Rental started" } }
    }

    const response = await apiClient.post(`/transactions/${id}/start-rental`)
    return { data: response.data }
  },

  // POST /transactions/{id}/complete-rental
  completeRental: async (id: string): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      await mockTransactionService.updateTransactionStatus(id, "COMPLETED")
      return { data: { message: "Rental completed successfully" } }
    }

    const response = await apiClient.post(`/transactions/${id}/complete-rental`)
    return { data: response.data }
  },

  // POST /transactions/{id}/request-release
  requestRelease: async (id: string, note?: string): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      return { data: { message: "Release requested" } }
    }

    const response = await apiClient.post(`/transactions/${id}/request-release`, { note })
    return { data: response.data }
  },

  // POST /transactions/{id}/confirm-release
  confirmRelease: async (id: string, amountToCaptureCents?: number): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      await mockTransactionService.updateTransactionStatus(id, "COMPLETED")
      return { data: { message: "Escrow released" } }
    }

    const response = await apiClient.post(`/transactions/${id}/confirm-release`, { amountToCaptureCents })
    return { data: response.data }
  },

  // POST /transactions/{id}/dispute
  raiseDispute: async (id: string, data: DisputeRequest): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      await mockTransactionService.updateTransactionStatus(id, "DISPUTED")
      return { data: { message: "Dispute raised successfully" } }
    }

    const response = await apiClient.post(`/transactions/${id}/dispute`, data)
    return { data: response.data }
  },

  // POST /transactions/{id}/admin/resolve-dispute (ADMIN ONLY)
  resolveDispute: async (id: string, data: ResolveDisputeRequest): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      await mockTransactionService.updateTransactionStatus(id, "COMPLETED")
      return { data: { message: "Dispute resolved" } }
    }

    const response = await apiClient.post(`/transactions/${id}/admin/resolve-dispute`, data)
    return { data: response.data }
  },

  // POST /transactions/{id}/deduct-damage (ADMIN ONLY)
  deductDamage: async (id: string, damageAmountCents: number): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      return { data: { message: "Damage charges deducted" } }
    }

    const response = await apiClient.post(`/transactions/${id}/deduct-damage?damageAmountCents=${damageAmountCents}`)
    return { data: response.data }
  },

  // POST /transactions/{id}/finalize-refund (ADMIN ONLY)
  finalizeRefund: async (id: string): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      await mockTransactionService.updateTransactionStatus(id, "REFUNDED")
      return { data: { message: "Refund finalized" } }
    }

    const response = await apiClient.post(`/transactions/${id}/finalize-refund`)
    return { data: response.data }
  },

  // Refund transaction
  refund: async (id: string, amountCents?: number): Promise<{ data: { message: string } }> => {
    if (USE_MOCK) {
      await mockTransactionService.updateTransactionStatus(id, "REFUNDED")
      return { data: { message: "Refund processed" } }
    }

    const url = `/transactions/${id}/refund${amountCents ? `?amountCents=${amountCents}` : ""}`
    const response = await apiClient.post(url)
    return { data: response.data }
  },
}

export default transactionService
