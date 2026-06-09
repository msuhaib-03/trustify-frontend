// ========================================================
// MOCK TRANSACTION SERVICE (localStorage-based)
// ========================================================
// This service simulates the complete transaction lifecycle
// with localStorage as a mock database. It will be replaced
// with real Spring Boot APIs later.
//
// All function signatures and responses MATCH the real backend
// APIs exactly to ensure seamless transition.
// ========================================================

interface Transaction {
  id: string
  listingId: string
  listing?: {
    id: string
    title: string
    price: number
    type: "SALE" | "RENT"
    imageUrls?: string[]
  }
  buyerId: string
  buyerName?: string
  sellerId: string
  sellerName?: string
  amountCents: number
  status:
    | "PENDING"
    | "ESCROW_HELD"
    | "RELEASE_REQUESTED"
    | "COMPLETED"
    | "REFUNDED"
    | "DISPUTED"
    | "CANCELLED"
    | "RENTAL_ACTIVE"
    | "RENTAL_COMPLETED"
  type: "SALE" | "RENT"
  stripePaymentIntentId?: string
  stripeClientSecret?: string
  createdAt: string
  updatedAt: string
  note?: string
  dispute?: {
    reason: string
    message: string
    status: "OPEN" | "RESOLVED"
    resolvedBy?: string
    resolution?: string
  }
  rentalDetails?: {
    startDate?: string
    endDate?: string
    expectedReturnDate?: string
    damageDeductionCents?: number
  }
}

const STORAGE_KEY = "mock_transactions"
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper to generate unique IDs
const generateId = (prefix = "txn") => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Get all transactions from localStorage
const getTransactionsFromStorage = (): Transaction[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    console.log("[Mock Transaction Service] Reading from localStorage, key:", STORAGE_KEY)
    console.log("[Mock Transaction Service] Raw stored data:", stored)
    const transactions = stored ? JSON.parse(stored) : []
    console.log("[Mock Transaction Service] Parsed transactions count:", transactions.length)
    return transactions
  } catch (error) {
    console.error("[Mock Transaction Service] Error reading from localStorage:", error)
    return []
  }
}

// Save transactions to localStorage
const saveTransactionsToStorage = (transactions: Transaction[]) => {
  if (typeof window === "undefined") return
  try {
    console.log("[Mock Transaction Service] Saving transactions to localStorage:", transactions.length)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
    console.log("[Mock Transaction Service] Successfully saved to localStorage")
  } catch (error) {
    console.error("[Mock Transaction Service] Failed to save to localStorage:", error)
  }
}

// Update a specific transaction
const updateTransaction = (id: string, updates: Partial<Transaction>) => {
  const transactions = getTransactionsFromStorage()
  const index = transactions.findIndex((t) => t.id === id)
  if (index !== -1) {
    transactions[index] = {
      ...transactions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    saveTransactionsToStorage(transactions)
    return transactions[index]
  }
  return null
}

// ========================================================
// MOCK TRANSACTION API IMPLEMENTATIONS
// ========================================================

export const mockTransactionService = {
  // 1. CREATE TRANSACTION
  // REAL API (to be enabled later): POST /api/transactions
  // axios.post('/api/transactions', data)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  create: async (data: { listingId: string; amountCents: number; type?: "SALE" | "RENT" }) => {
    console.log("[Mock Transaction Service] Creating transaction:", data)
    await delay(800) // Simulate network delay

    // Get listing details from localStorage (mock listings)
    const listingsStored = localStorage.getItem("mock_listings")
    const listings = listingsStored ? JSON.parse(listingsStored) : []
    const listing = listings.find((l: any) => l.id === data.listingId)

    // Get current user from localStorage
    const userStored = localStorage.getItem("user")
    const currentUser = userStored ? JSON.parse(userStored) : { id: "mock-buyer", username: "Mock Buyer" }

    const transactionId = generateId("txn")
    const paymentIntentId = `pi_mock_${transactionId}`
    const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 16)}`

    const newTransaction: Transaction = {
      id: transactionId,
      listingId: data.listingId,
      listing: listing
        ? {
            id: listing.id,
            title: listing.title,
            price: listing.price,
            type: listing.type || "SALE",
            imageUrls: listing.imageUrls,
          }
        : undefined,
      buyerId: currentUser.id || currentUser.email,
      buyerName: currentUser.username,
      sellerId: listing?.userId || listing?.seller?.id || "mock-seller",
      sellerName: listing?.seller?.username || "Seller",
      amountCents: data.amountCents,
      status: "ESCROW_HELD",
      type: data.type || listing?.type || "SALE",
      stripePaymentIntentId: paymentIntentId,
      stripeClientSecret: clientSecret,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Save to localStorage
    const transactions = getTransactionsFromStorage()
    transactions.push(newTransaction)
    saveTransactionsToStorage(transactions)

    const verifyTransactions = getTransactionsFromStorage()
    const savedTransaction = verifyTransactions.find((t) => t.id === transactionId)
    console.log("[Mock Transaction Service] Transaction verified in storage:", !!savedTransaction)

    console.log("[Mock Transaction Service] Transaction created:", newTransaction)

    return {
      data: {
        transactionId: newTransaction.id,
        stripeClientSecret: clientSecret,
        stripePaymentIntentId: paymentIntentId,
        transaction: newTransaction,
      },
    }
  },

  // 2. GET TRANSACTION BY ID
  // REAL API (to be enabled later): GET /api/transactions/{id}
  // axios.get(`/api/transactions/${id}`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getById: async (id: string) => {
    console.log("[Mock Transaction Service] getById called with id:", id)
    await delay(300)

    const transactions = getTransactionsFromStorage()
    console.log("[Mock Transaction Service] Total transactions in storage:", transactions.length)
    console.log(
      "[Mock Transaction Service] Transaction IDs in storage:",
      transactions.map((t) => t.id),
    )

    const transaction = transactions.find((t) => t.id === id)
    console.log("[Mock Transaction Service] Found transaction:", !!transaction)

    if (!transaction) {
      console.error("[Mock Transaction Service] Transaction not found. Looking for:", id)
      console.error(
        "[Mock Transaction Service] Available IDs:",
        transactions.map((t) => t.id),
      )
      throw new Error("Transaction not found")
    }

    console.log("[Mock Transaction Service] Returning transaction:", transaction)
    return { data: transaction }
  },

  // 3. GET ALL TRANSACTIONS (User-specific or All for Admin)
  // REAL API (to be enabled later): GET /api/transactions
  // axios.get('/api/transactions', { params })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getAll: async (params?: { page?: number; size?: number; userId?: string }) => {
    console.log("[Mock Transaction Service] Fetching all transactions:", params)
    await delay(400)

    let transactions = getTransactionsFromStorage()

    // Filter by userId if provided
    if (params?.userId) {
      transactions = transactions.filter((t) => t.buyerId === params.userId || t.sellerId === params.userId)
    }

    // Sort by createdAt desc
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const page = params?.page || 0
    const size = params?.size || 20
    const start = page * size
    const end = start + size
    const paginatedTransactions = transactions.slice(start, end)

    return {
      data: {
        content: paginatedTransactions,
        totalElements: transactions.length,
        totalPages: Math.ceil(transactions.length / size),
        currentPage: page,
      },
    }
  },

  // ACCEPT CONDITIONS
  // REAL API (to be enabled later): POST /api/transactions/{id}/accept-conditions
  // axios.post(`/api/transactions/${id}/accept-conditions`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  acceptConditions: async (id: string) => {
    console.log("[Mock Transaction Service] Accepting conditions for transaction:", id)
    await delay(500)

    const updatedTransaction = updateTransaction(id, {
      status: "ESCROW_HELD",
      note: "Rental conditions accepted",
    })

    if (!updatedTransaction) {
      throw new Error("Transaction not found")
    }

    return {
      data: {
        message: "Conditions accepted successfully",
        transaction: updatedTransaction,
      },
    }
  },

  // 4. REQUEST RELEASE
  // REAL API (to be enabled later): POST /api/transactions/{id}/request-release
  // axios.post(`/api/transactions/${id}/request-release`, { note })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  requestRelease: async (id: string, note?: string) => {
    console.log("[Mock Transaction Service] Requesting release for transaction:", id)
    await delay(600)

    const updatedTransaction = updateTransaction(id, {
      status: "RELEASE_REQUESTED",
      note: note || "Buyer has requested fund release",
    })

    if (!updatedTransaction) {
      throw new Error("Transaction not found")
    }

    return {
      data: {
        message: "Release requested successfully",
        transaction: updatedTransaction,
      },
    }
  },

  // 5. CONFIRM RELEASE
  // REAL API (to be enabled later): POST /api/transactions/{id}/confirm-release
  // axios.post(`/api/transactions/${id}/confirm-release`, { amountToCaptureCents })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  confirmRelease: async (id: string, amountToCaptureCents?: number) => {
    console.log("[Mock Transaction Service] Confirming release for transaction:", id)
    await delay(800)

    const updatedTransaction = updateTransaction(id, {
      status: "COMPLETED",
      note: "Funds released to seller",
    })

    if (!updatedTransaction) {
      throw new Error("Transaction not found")
    }

    return {
      data: {
        message: "Payment released successfully",
        transaction: updatedTransaction,
        amountCaptured: amountToCaptureCents || updatedTransaction.amountCents,
      },
    }
  },

  // 6. OPEN DISPUTE
  // REAL API (to be enabled later): POST /api/transactions/{id}/dispute
  // axios.post(`/api/transactions/${id}/dispute`, data)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  dispute: async (id: string, data: { reason: string; message: string }) => {
    console.log("[Mock Transaction Service] Opening dispute for transaction:", id)
    await delay(700)

    const updatedTransaction = updateTransaction(id, {
      status: "DISPUTED",
      dispute: {
        reason: data.reason,
        message: data.message,
        status: "OPEN",
      },
    })

    if (!updatedTransaction) {
      throw new Error("Transaction not found")
    }

    return {
      data: {
        message: "Dispute opened successfully",
        transaction: updatedTransaction,
      },
    }
  },

  // 7. ADMIN RESOLVE DISPUTE
  // REAL API (to be enabled later): POST /api/admin/transactions/{id}/resolve-dispute
  // axios.post(`/api/admin/transactions/${id}/resolve-dispute`, data)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  adminResolveDispute: async (id: string, data: { resolution: string; amountCents?: number }) => {
    console.log("[Mock Transaction Service] Admin resolving dispute:", id)
    await delay(800)

    const resolution = data.resolution.toLowerCase()
    let newStatus: Transaction["status"] = "COMPLETED"

    if (resolution.includes("refund") || resolution.includes("buyer")) {
      newStatus = "REFUNDED"
    } else if (resolution.includes("seller") || resolution.includes("release")) {
      newStatus = "COMPLETED"
    }

    const updatedTransaction = updateTransaction(id, {
      status: newStatus,
      dispute: {
        reason: "", // Keep original reason
        message: "", // Keep original message
        status: "RESOLVED",
        resolvedBy: "admin",
        resolution: data.resolution,
      },
    })

    if (!updatedTransaction) {
      throw new Error("Transaction not found")
    }

    return {
      data: {
        message: "Dispute resolved successfully",
        transaction: updatedTransaction,
        resolution: data.resolution,
      },
    }
  },

  // 8. REFUND TRANSACTION
  // REAL API (to be enabled later): POST /api/transactions/{id}/refund
  // axios.post(`/api/transactions/${id}/refund`, { amountCents })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  refund: async (id: string, amountCents?: number) => {
    console.log("[Mock Transaction Service] Initiating refund for transaction:", id)
    await delay(700)

    const transactions = getTransactionsFromStorage()
    const transaction = transactions.find((t) => t.id === id)

    if (!transaction) {
      throw new Error("Transaction not found")
    }

    const refundAmount = amountCents || transaction.amountCents

    const updatedTransaction = updateTransaction(id, {
      status: "REFUNDED",
      note: `Refunded Rs. ${(refundAmount / 100).toFixed(2)}`,
    })

    return {
      data: {
        message: "Refund initiated successfully",
        transaction: updatedTransaction,
        refundedAmount: refundAmount,
      },
    }
  },

  // 9. START RENTAL
  // REAL API (to be enabled later): POST /api/transactions/{id}/start-rental
  // axios.post(`/api/transactions/${id}/start-rental`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  startRental: async (id: string) => {
    console.log("[Mock Transaction Service] Starting rental for transaction:", id)
    await delay(600)

    const transactions = getTransactionsFromStorage()
    const transaction = transactions.find((t) => t.id === id)

    if (!transaction) {
      throw new Error("Transaction not found")
    }

    const startDate = new Date()
    const expectedReturnDate = new Date(startDate)
    expectedReturnDate.setDate(expectedReturnDate.getDate() + 7) // 7 days rental

    const updatedTransaction = updateTransaction(id, {
      status: "RENTAL_ACTIVE",
      rentalDetails: {
        startDate: startDate.toISOString(),
        expectedReturnDate: expectedReturnDate.toISOString(),
      },
    })

    return {
      data: {
        message: "Rental started successfully",
        transaction: updatedTransaction,
      },
    }
  },

  // 10. COMPLETE RENTAL
  // REAL API (to be enabled later): POST /api/transactions/{id}/complete-rental
  // axios.post(`/api/transactions/${id}/complete-rental`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  completeRental: async (id: string) => {
    console.log("[Mock Transaction Service] Completing rental for transaction:", id)
    await delay(600)

    const transactions = getTransactionsFromStorage()
    const transaction = transactions.find((t) => t.id === id)

    if (!transaction) {
      throw new Error("Transaction not found")
    }

    const updatedTransaction = updateTransaction(id, {
      status: "RENTAL_COMPLETED",
      rentalDetails: {
        ...transaction.rentalDetails,
        endDate: new Date().toISOString(),
      },
    })

    return {
      data: {
        message: "Rental completed successfully",
        transaction: updatedTransaction,
      },
    }
  },

  // 11. DEDUCT DAMAGE FROM RENTAL
  // REAL API (to be enabled later): POST /api/transactions/{id}/deduct-damage
  // axios.post(`/api/transactions/${id}/deduct-damage`, { damageAmountCents })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  deductDamage: async (id: string, damageAmountCents: number) => {
    console.log("[Mock Transaction Service] Deducting damage for transaction:", id, damageAmountCents)
    await delay(500)

    const transactions = getTransactionsFromStorage()
    const transaction = transactions.find((t) => t.id === id)

    if (!transaction) {
      throw new Error("Transaction not found")
    }

    const updatedTransaction = updateTransaction(id, {
      rentalDetails: {
        ...transaction.rentalDetails,
        damageDeductionCents: damageAmountCents,
      },
      note: `Damage deduction: Rs. ${(damageAmountCents / 100).toFixed(2)}`,
    })

    return {
      data: {
        message: "Damage deduction applied",
        transaction: updatedTransaction,
        deductedAmount: damageAmountCents,
      },
    }
  },

  // 12. FINALIZE REFUND (After rental completion with damages)
  // REAL API (to be enabled later): POST /api/transactions/{id}/finalize-refund
  // axios.post(`/api/transactions/${id}/finalize-refund`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  finalizeRefund: async (id: string) => {
    console.log("[Mock Transaction Service] Finalizing refund for transaction:", id)
    await delay(700)

    const transactions = getTransactionsFromStorage()
    const transaction = transactions.find((t) => t.id === id)

    if (!transaction) {
      throw new Error("Transaction not found")
    }

    const damageDeduction = transaction.rentalDetails?.damageDeductionCents || 0
    const refundAmount = transaction.amountCents - damageDeduction

    const updatedTransaction = updateTransaction(id, {
      status: "REFUNDED",
      note: `Final refund: Rs. ${(refundAmount / 100).toFixed(2)} (after Rs. ${(damageDeduction / 100).toFixed(2)} damage deduction)`,
    })

    return {
      data: {
        message: "Refund finalized successfully",
        transaction: updatedTransaction,
        refundedAmount: refundAmount,
        damageDeduction: damageDeduction,
      },
    }
  },

  // 13. GET ADMIN STATS
  // REAL API (to be enabled later): GET /api/admin/transactions/stats
  // axios.get('/api/admin/transactions/stats')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getAdminStats: async () => {
    console.log("[Mock Transaction Service] Fetching admin stats")
    await delay(300)

    const transactions = getTransactionsFromStorage()

    const totalVolume = transactions.reduce((sum, t) => sum + t.amountCents, 0)
    const pendingCount = transactions.filter((t) =>
      ["PENDING", "ESCROW_HELD", "RELEASE_REQUESTED", "RENTAL_ACTIVE"].includes(t.status),
    ).length
    const completedCount = transactions.filter((t) => ["COMPLETED", "RENTAL_COMPLETED"].includes(t.status)).length
    const disputedCount = transactions.filter((t) => t.status === "DISPUTED").length

    return {
      data: {
        totalVolume,
        pendingTransactions: pendingCount,
        completedTransactions: completedCount,
        disputedTransactions: disputedCount,
      },
    }
  },

  // 14. GET ALL ADMIN TRANSACTIONS (same as getAll but used by admin)
  // REAL API (to be enabled later): GET /api/admin/transactions
  // axios.get('/api/admin/transactions', { params })
  // MOCK IMPLEMENTATION (temporary - uses localStorage, reuses getAll)
  getAdminTransactions: async (params?: { page?: number; size?: number }) => {
    console.log("[Mock Transaction Service] Admin fetching all transactions:", params)
    // Reuse the getAll method - admin sees all transactions
    return mockTransactionService.getAll(params)
  },

  // Helper: Clear all transactions (for testing)
  clearAll: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
      console.log("[Mock Transaction Service] All transactions cleared")
    }
  },
}

export default mockTransactionService
