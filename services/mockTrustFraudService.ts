// ========================================================
// MOCK TRUST & FRAUD SERVICE (localStorage-based)
// ========================================================
// This service simulates the fraud score and trust rating system
// with localStorage as a mock database. It will be replaced with
// real Spring Boot APIs later.
//
// All function signatures and responses MATCH the real backend
// APIs exactly to ensure seamless transition.
//
// FUTURE BACKEND ENDPOINTS:
// GET /admin/users - Get all users with fraud/trust data
// GET /admin/stats - Get fraud statistics
// GET /admin/users/high-risk - Get high risk users
// ========================================================

export interface TrustFraudUser {
  id: string
  name: string
  email: string
  verified: boolean
  fraudScore: number // 0-100
  trustRating: number // 1.0-5.0
  disputeCount: number
  totalTransactions: number
  successfulTransactions: number
  suspended: boolean
  createdAt: string
  lastActive: string
}

export interface FraudStats {
  safeUsers: number
  mediumRiskUsers: number
  highRiskUsers: number
  criticalUsers: number
  totalUsers: number
  averageTrustRating: number
}

export interface HighRiskUser {
  id: string
  name: string
  email: string
  fraudScore: number
  trustRating: number
  riskLevel: "HIGH" | "CRITICAL"
  flaggedReason: string
  flaggedAt: string
}

// Risk level thresholds
export const FRAUD_SCORE_THRESHOLDS = {
  SAFE: { min: 0, max: 20 },
  MEDIUM: { min: 21, max: 50 },
  HIGH: { min: 51, max: 80 },
  CRITICAL: { min: 81, max: 100 },
}

export const TRUST_RATING_THRESHOLDS = {
  TRUSTED: { min: 4.5, max: 5.0 },
  NORMAL: { min: 3.0, max: 4.4 },
  RISKY: { min: 1.0, max: 2.9 },
}

const STORAGE_KEY = "mock_trust_fraud_users"
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper to generate unique IDs
const generateId = (prefix = "user") => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Get risk level from fraud score
export const getRiskLevelFromScore = (score: number): "SAFE" | "MEDIUM" | "HIGH" | "CRITICAL" => {
  if (score <= FRAUD_SCORE_THRESHOLDS.SAFE.max) return "SAFE"
  if (score <= FRAUD_SCORE_THRESHOLDS.MEDIUM.max) return "MEDIUM"
  if (score <= FRAUD_SCORE_THRESHOLDS.HIGH.max) return "HIGH"
  return "CRITICAL"
}

// Get trust badge from rating
export const getTrustBadgeFromRating = (rating: number): "TRUSTED" | "NORMAL" | "RISKY" => {
  if (rating >= TRUST_RATING_THRESHOLDS.TRUSTED.min) return "TRUSTED"
  if (rating >= TRUST_RATING_THRESHOLDS.NORMAL.min) return "NORMAL"
  return "RISKY"
}

// Get color classes for risk level
export const getRiskLevelColor = (level: string) => {
  switch (level) {
    case "SAFE":
      return "bg-green-500/10 text-green-600 border-green-500/20"
    case "MEDIUM":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
    case "HIGH":
      return "bg-orange-500/10 text-orange-600 border-orange-500/20"
    case "CRITICAL":
      return "bg-red-500/10 text-red-600 border-red-500/20"
    default:
      return "bg-gray-500/10 text-gray-600"
  }
}

// Get color classes for trust badge
export const getTrustBadgeColor = (badge: string) => {
  switch (badge) {
    case "TRUSTED":
      return "bg-green-500/10 text-green-600 border-green-500/20"
    case "NORMAL":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20"
    case "RISKY":
      return "bg-red-500/10 text-red-600 border-red-500/20"
    default:
      return "bg-gray-500/10 text-gray-600"
  }
}

// Initial seed data
const seedUsers: TrustFraudUser[] = [
  {
    id: "user-001",
    name: "Muhammad Suhaib",
    email: "suhaib@gmail.com",
    verified: true,
    fraudScore: 12,
    trustRating: 4.8,
    disputeCount: 0,
    totalTransactions: 15,
    successfulTransactions: 14,
    suspended: false,
    createdAt: "2024-01-15T10:00:00Z",
    lastActive: "2024-12-01T14:30:00Z",
  },
  {
    id: "user-002",
    name: "Ali Khan",
    email: "ali.khan@example.com",
    verified: false,
    fraudScore: 78,
    trustRating: 1.9,
    disputeCount: 5,
    totalTransactions: 8,
    successfulTransactions: 3,
    suspended: false,
    createdAt: "2024-06-20T08:00:00Z",
    lastActive: "2024-11-28T09:15:00Z",
  },
  {
    id: "user-003",
    name: "Sara Ahmed",
    email: "sara.ahmed@example.com",
    verified: true,
    fraudScore: 5,
    trustRating: 4.9,
    disputeCount: 0,
    totalTransactions: 45,
    successfulTransactions: 45,
    suspended: false,
    createdAt: "2023-08-10T12:00:00Z",
    lastActive: "2024-12-02T16:45:00Z",
  },
  {
    id: "user-004",
    name: "Ahmed Hassan",
    email: "ahmed.hassan@example.com",
    verified: true,
    fraudScore: 35,
    trustRating: 3.5,
    disputeCount: 2,
    totalTransactions: 22,
    successfulTransactions: 18,
    suspended: false,
    createdAt: "2024-02-28T14:00:00Z",
    lastActive: "2024-11-30T11:20:00Z",
  },
  {
    id: "user-005",
    name: "Fatima Rizvi",
    email: "fatima.rizvi@example.com",
    verified: true,
    fraudScore: 8,
    trustRating: 4.7,
    disputeCount: 1,
    totalTransactions: 30,
    successfulTransactions: 29,
    suspended: false,
    createdAt: "2023-11-05T09:00:00Z",
    lastActive: "2024-12-01T18:00:00Z",
  },
  {
    id: "user-006",
    name: "Usman Malik",
    email: "usman.malik@example.com",
    verified: false,
    fraudScore: 85,
    trustRating: 1.5,
    disputeCount: 8,
    totalTransactions: 12,
    successfulTransactions: 4,
    suspended: true,
    createdAt: "2024-07-15T16:00:00Z",
    lastActive: "2024-10-20T10:00:00Z",
  },
  {
    id: "user-007",
    name: "Zainab Qureshi",
    email: "zainab.q@example.com",
    verified: true,
    fraudScore: 15,
    trustRating: 4.5,
    disputeCount: 0,
    totalTransactions: 18,
    successfulTransactions: 18,
    suspended: false,
    createdAt: "2024-03-10T11:00:00Z",
    lastActive: "2024-12-02T08:30:00Z",
  },
  {
    id: "user-008",
    name: "Bilal Siddiqui",
    email: "bilal.s@example.com",
    verified: false,
    fraudScore: 62,
    trustRating: 2.3,
    disputeCount: 4,
    totalTransactions: 15,
    successfulTransactions: 9,
    suspended: false,
    createdAt: "2024-05-22T13:00:00Z",
    lastActive: "2024-11-25T15:45:00Z",
  },
  {
    id: "user-009",
    name: "Ayesha Tariq",
    email: "ayesha.t@example.com",
    verified: true,
    fraudScore: 3,
    trustRating: 5.0,
    disputeCount: 0,
    totalTransactions: 52,
    successfulTransactions: 52,
    suspended: false,
    createdAt: "2023-05-18T10:00:00Z",
    lastActive: "2024-12-02T12:00:00Z",
  },
  {
    id: "user-010",
    name: "Imran Shah",
    email: "imran.shah@example.com",
    verified: false,
    fraudScore: 92,
    trustRating: 1.2,
    disputeCount: 10,
    totalTransactions: 6,
    successfulTransactions: 1,
    suspended: true,
    createdAt: "2024-08-05T08:00:00Z",
    lastActive: "2024-09-15T14:00:00Z",
  },
  {
    id: "user-011",
    name: "Hira Nawaz",
    email: "hira.n@example.com",
    verified: true,
    fraudScore: 18,
    trustRating: 4.3,
    disputeCount: 1,
    totalTransactions: 25,
    successfulTransactions: 24,
    suspended: false,
    createdAt: "2024-01-08T15:00:00Z",
    lastActive: "2024-12-01T09:30:00Z",
  },
  {
    id: "user-012",
    name: "Kamran Javed",
    email: "kamran.j@example.com",
    verified: true,
    fraudScore: 42,
    trustRating: 3.2,
    disputeCount: 3,
    totalTransactions: 19,
    successfulTransactions: 14,
    suspended: false,
    createdAt: "2024-04-12T10:00:00Z",
    lastActive: "2024-11-29T17:15:00Z",
  },
]

// Get users from localStorage or seed with initial data
const getUsersFromStorage = (): TrustFraudUser[] => {
  if (typeof window === "undefined") return seedUsers
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedUsers))
      return seedUsers
    }
    return JSON.parse(stored)
  } catch (error) {
    console.error("[Mock Trust Fraud Service] Error reading from localStorage:", error)
    return seedUsers
  }
}

// Save users to localStorage
const saveUsersToStorage = (users: TrustFraudUser[]) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch (error) {
    console.error("[Mock Trust Fraud Service] Failed to save to localStorage:", error)
  }
}

// ========================================================
// MOCK TRUST FRAUD API IMPLEMENTATIONS
// ========================================================

export const mockTrustFraudService = {
  // 1. GET ALL USERS WITH TRUST/FRAUD DATA (Admin)
  // REAL API (to be enabled later): GET /admin/users
  // axios.get('/admin/users', { params })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getAllUsers: async (params?: { page?: number; size?: number; search?: string; riskLevel?: string }) => {
    await delay(400)

    let users = getUsersFromStorage()

    // Filter by search term
    if (params?.search) {
      const searchLower = params.search.toLowerCase()
      users = users.filter(
        (u) => u.name.toLowerCase().includes(searchLower) || u.email.toLowerCase().includes(searchLower)
      )
    }

    // Filter by risk level
    if (params?.riskLevel && params.riskLevel !== "all") {
      users = users.filter((u) => getRiskLevelFromScore(u.fraudScore) === params.riskLevel)
    }

    // Sort by fraud score desc (highest risk first)
    users.sort((a, b) => b.fraudScore - a.fraudScore)

    const page = params?.page || 0
    const size = params?.size || 20
    const start = page * size
    const end = start + size
    const paginatedUsers = users.slice(start, end)

    return {
      data: {
        content: paginatedUsers,
        totalElements: users.length,
        totalPages: Math.ceil(users.length / size),
        currentPage: page,
      },
    }
  },

  // 2. GET FRAUD STATISTICS (Admin)
  // REAL API (to be enabled later): GET /admin/stats
  // axios.get('/admin/stats')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getStats: async (): Promise<{ data: FraudStats }> => {
    await delay(300)

    const users = getUsersFromStorage()

    const safeUsers = users.filter((u) => getRiskLevelFromScore(u.fraudScore) === "SAFE").length
    const mediumRiskUsers = users.filter((u) => getRiskLevelFromScore(u.fraudScore) === "MEDIUM").length
    const highRiskUsers = users.filter((u) => getRiskLevelFromScore(u.fraudScore) === "HIGH").length
    const criticalUsers = users.filter((u) => getRiskLevelFromScore(u.fraudScore) === "CRITICAL").length

    const totalRating = users.reduce((sum, u) => sum + u.trustRating, 0)
    const averageTrustRating = users.length > 0 ? Math.round((totalRating / users.length) * 10) / 10 : 0

    return {
      data: {
        safeUsers,
        mediumRiskUsers,
        highRiskUsers,
        criticalUsers,
        totalUsers: users.length,
        averageTrustRating,
      },
    }
  },

  // 3. GET HIGH RISK USERS (Admin)
  // REAL API (to be enabled later): GET /admin/users/high-risk
  // axios.get('/admin/users/high-risk')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getHighRiskUsers: async (): Promise<{ data: HighRiskUser[] }> => {
    await delay(350)

    const users = getUsersFromStorage()

    const highRiskUsers: HighRiskUser[] = users
      .filter((u) => u.fraudScore > 50)
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        fraudScore: u.fraudScore,
        trustRating: u.trustRating,
        riskLevel: u.fraudScore > 80 ? "CRITICAL" : "HIGH",
        flaggedReason:
          u.fraudScore > 80
            ? "Multiple fraud indicators detected"
            : u.disputeCount > 3
              ? "High dispute rate"
              : "Suspicious activity pattern",
        flaggedAt: u.lastActive,
      }))
      .sort((a, b) => b.fraudScore - a.fraudScore)

    return { data: highRiskUsers }
  },

  // 4. GET USER BY ID
  // REAL API (to be enabled later): GET /admin/users/{id}
  // axios.get(`/admin/users/${id}`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getUserById: async (userId: string): Promise<{ data: TrustFraudUser | null }> => {
    await delay(200)

    const users = getUsersFromStorage()
    const user = users.find((u) => u.id === userId)

    return { data: user || null }
  },

  // 5. GET CURRENT USER'S TRUST DATA
  // REAL API (to be enabled later): GET /api/user/trust-profile
  // axios.get('/api/user/trust-profile')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getCurrentUserTrustProfile: async () => {
    await delay(300)

    // Get current logged-in user
    const userStored = localStorage.getItem("user")
    if (!userStored) {
      return {
        data: {
          fraudScore: 10,
          trustRating: 4.5,
          riskLevel: "SAFE" as const,
          trustBadge: "TRUSTED" as const,
          verified: true,
          disputeCount: 0,
          totalTransactions: 0,
          successfulTransactions: 0,
        },
      }
    }

    const currentUser = JSON.parse(userStored)
    const users = getUsersFromStorage()

    // Find matching user by email
    const matchedUser = users.find((u) => u.email === currentUser.email)

    if (matchedUser) {
      return {
        data: {
          fraudScore: matchedUser.fraudScore,
          trustRating: matchedUser.trustRating,
          riskLevel: getRiskLevelFromScore(matchedUser.fraudScore),
          trustBadge: getTrustBadgeFromRating(matchedUser.trustRating),
          verified: matchedUser.verified,
          disputeCount: matchedUser.disputeCount,
          totalTransactions: matchedUser.totalTransactions,
          successfulTransactions: matchedUser.successfulTransactions,
        },
      }
    }

    // Return default safe profile for new users
    return {
      data: {
        fraudScore: 10,
        trustRating: 4.5,
        riskLevel: "SAFE" as const,
        trustBadge: "TRUSTED" as const,
        verified: true,
        disputeCount: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
      },
    }
  },

  // 6. UPDATE USER FRAUD SCORE (Admin)
  // REAL API (to be enabled later): PUT /admin/users/{id}/fraud-score
  // axios.put(`/admin/users/${id}/fraud-score`, { fraudScore })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  updateFraudScore: async (userId: string, fraudScore: number) => {
    await delay(400)

    const users = getUsersFromStorage()
    const index = users.findIndex((u) => u.id === userId)

    if (index === -1) {
      throw new Error("User not found")
    }

    users[index] = {
      ...users[index],
      fraudScore,
      lastActive: new Date().toISOString(),
    }

    saveUsersToStorage(users)

    return {
      data: {
        message: "Fraud score updated successfully",
        user: users[index],
      },
    }
  },

  // 7. SUSPEND USER (Admin)
  // REAL API (to be enabled later): PUT /admin/users/{id}/suspend
  // axios.put(`/admin/users/${id}/suspend`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  suspendUser: async (userId: string) => {
    await delay(400)

    const users = getUsersFromStorage()
    const index = users.findIndex((u) => u.id === userId)

    if (index === -1) {
      throw new Error("User not found")
    }

    users[index] = {
      ...users[index],
      suspended: true,
      lastActive: new Date().toISOString(),
    }

    saveUsersToStorage(users)

    return {
      data: {
        message: "User suspended successfully",
        user: users[index],
      },
    }
  },

  // 8. UNSUSPEND USER (Admin)
  // REAL API (to be enabled later): PUT /admin/users/{id}/unsuspend
  // axios.put(`/admin/users/${id}/unsuspend`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  unsuspendUser: async (userId: string) => {
    await delay(400)

    const users = getUsersFromStorage()
    const index = users.findIndex((u) => u.id === userId)

    if (index === -1) {
      throw new Error("User not found")
    }

    users[index] = {
      ...users[index],
      suspended: false,
      lastActive: new Date().toISOString(),
    }

    saveUsersToStorage(users)

    return {
      data: {
        message: "User unsuspended successfully",
        user: users[index],
      },
    }
  },

  // 9. UPDATE USER TRUST RATING (Admin)
  // REAL API (to be enabled later): PUT /admin/users/{id}/trust-rating
  // axios.put(`/admin/users/${id}/trust-rating`, { trustRating })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  updateTrustRating: async (userId: string, trustRating: number) => {
    await delay(400)

    const users = getUsersFromStorage()
    const index = users.findIndex((u) => u.id === userId)

    if (index === -1) {
      throw new Error("User not found")
    }

    // Clamp trust rating between 1.0 and 5.0
    const clampedRating = Math.max(1.0, Math.min(5.0, trustRating))

    users[index] = {
      ...users[index],
      trustRating: clampedRating,
      lastActive: new Date().toISOString(),
    }

    saveUsersToStorage(users)

    return {
      data: {
        message: "Trust rating updated successfully",
        user: users[index],
      },
    }
  },

  // 10. MARK USER AS SAFE (Admin)
  // REAL API (to be enabled later): PUT /admin/users/{id}/mark-safe
  // axios.put(`/admin/users/${id}/mark-safe`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  markUserSafe: async (userId: string) => {
    await delay(400)

    const users = getUsersFromStorage()
    const index = users.findIndex((u) => u.id === userId)

    if (index === -1) {
      throw new Error("User not found")
    }

    users[index] = {
      ...users[index],
      fraudScore: 10, // Safe score
      trustRating: Math.max(users[index].trustRating, 4.0), // Improve trust rating
      suspended: false,
      lastActive: new Date().toISOString(),
    }

    saveUsersToStorage(users)

    return {
      data: {
        message: "User marked as safe successfully",
        user: users[index],
      },
    }
  },

  // 11. FLAG USER AS SUSPICIOUS (Admin)
  // REAL API (to be enabled later): PUT /admin/users/{id}/flag-suspicious
  // axios.put(`/admin/users/${id}/flag-suspicious`, { reason })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  flagUserSuspicious: async (userId: string, reason?: string) => {
    await delay(400)

    const users = getUsersFromStorage()
    const index = users.findIndex((u) => u.id === userId)

    if (index === -1) {
      throw new Error("User not found")
    }

    users[index] = {
      ...users[index],
      fraudScore: Math.min(users[index].fraudScore + 30, 95), // Increase fraud score
      trustRating: Math.max(users[index].trustRating - 1.0, 1.0), // Decrease trust rating
      lastActive: new Date().toISOString(),
    }

    saveUsersToStorage(users)

    return {
      data: {
        message: "User flagged as suspicious",
        user: users[index],
        reason: reason || "Flagged by admin",
      },
    }
  },

  // 12. FULL USER UPDATE (Admin) - Update multiple fields at once
  // REAL API (to be enabled later): PUT /admin/users/{id}
  // axios.put(`/admin/users/${id}`, updateData)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  updateUser: async (
    userId: string,
    updateData: {
      fraudScore?: number
      trustRating?: number
      verified?: boolean
      suspended?: boolean
    }
  ) => {
    await delay(400)

    const users = getUsersFromStorage()
    const index = users.findIndex((u) => u.id === userId)

    if (index === -1) {
      throw new Error("User not found")
    }

    const updatedUser = { ...users[index] }

    if (updateData.fraudScore !== undefined) {
      updatedUser.fraudScore = Math.max(0, Math.min(100, updateData.fraudScore))
    }
    if (updateData.trustRating !== undefined) {
      updatedUser.trustRating = Math.max(1.0, Math.min(5.0, updateData.trustRating))
    }
    if (updateData.verified !== undefined) {
      updatedUser.verified = updateData.verified
    }
    if (updateData.suspended !== undefined) {
      updatedUser.suspended = updateData.suspended
    }

    updatedUser.lastActive = new Date().toISOString()
    users[index] = updatedUser

    saveUsersToStorage(users)

    return {
      data: {
        message: "User updated successfully",
        user: updatedUser,
      },
    }
  },

  // Helper: Reset to seed data (for testing)
  resetToSeedData: () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedUsers))
    }
  },
}

export default mockTrustFraudService
