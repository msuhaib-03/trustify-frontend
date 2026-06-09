// ========================================================
// MOCK VERIFICATION SERVICE (localStorage-based)
// ========================================================
// This service simulates the user identity verification system
// with localStorage as a mock database. It will be replaced with
// real Spring Boot APIs later.
//
// All function signatures and responses MATCH the real backend
// APIs exactly to ensure seamless transition.
// ========================================================

export interface UserVerification {
  verificationId: string
  userId: string
  userName: string
  userEmail: string

  // Personal Information
  fullName: string
  cnicNumber: string
  dateOfBirth: string
  gender: string
  nationality: string

  // Document Upload
  cnicFrontImage: string
  cnicBackImage: string
  cnicUploadDate: string

  // Verification Status
  overallStatus: "NOT_VERIFIED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED"
  cnicVerified: boolean
  profileVerified: boolean

  // Admin Review
  reviewedBy: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  adminRemarks: string | null

  // Timestamps
  createdAt: string
  updatedAt: string
  submittedAt: string | null
}

const STORAGE_KEY = "mock_verifications"
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper function to convert File to data URL for mock storage
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Helper to generate unique IDs
const generateId = (prefix = "ver") => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Get all verifications from localStorage
const getVerificationsFromStorage = (): UserVerification[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("[Mock Verification Service] Error reading from localStorage:", error)
    return []
  }
}

// Save verifications to localStorage
const saveVerificationsToStorage = (verifications: UserVerification[]) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(verifications))
  } catch (error) {
    console.error("[Mock Verification Service] Failed to save to localStorage:", error)
  }
}

// ========================================================
// MOCK VERIFICATION API IMPLEMENTATIONS
// ========================================================

export const mockVerificationService = {
  // 1. SUBMIT VERIFICATION (User)
  // REAL API (to be enabled later): POST /api/verification/submit
  // axios.post('/api/verification/submit', data)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  submitVerification: async (data: {
    // Support File objects or strings for backward compatibility
    frontImage?: File | string
    backImage?: File | string
    cnicFrontImage?: string
    cnicBackImage?: string
  }) => {
    await delay(800)

    // Get current user
    const userStored = localStorage.getItem("user")
    const currentUser = userStored
      ? JSON.parse(userStored)
      : { id: "mock-user", username: "Mock User", email: "user@example.com" }

    // Support both File objects and strings - convert Files to data URLs for mock storage
    let cnicFront = ""
    let cnicBack = ""
    
    const frontImg = data.frontImage || data.cnicFrontImage
    const backImg = data.backImage || data.cnicBackImage
    
    if (frontImg instanceof File) {
      cnicFront = await fileToDataUrl(frontImg)
    } else {
      cnicFront = frontImg || ""
    }
    
    if (backImg instanceof File) {
      cnicBack = await fileToDataUrl(backImg)
    } else {
      cnicBack = backImg || ""
    }

    const newVerification: UserVerification = {
      verificationId: generateId("ver"),
      userId: currentUser.id || currentUser.email || "unknown",
      userName: currentUser.username || currentUser.name || "Unknown User",
      userEmail: currentUser.email || "unknown@example.com",

      fullName: currentUser.username || currentUser.name || "User",
      cnicNumber: "",
      dateOfBirth: "",
      gender: "",
      nationality: "Pakistan",

      cnicFrontImage: cnicFront,
      cnicBackImage: cnicBack,
      cnicUploadDate: new Date().toISOString(),

      overallStatus: "UNDER_REVIEW",
      cnicVerified: false,
      profileVerified: false,

      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      adminRemarks: null,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    }

    const verifications = getVerificationsFromStorage()
    // Remove any existing verification for this user
    const filteredVerifications = verifications.filter((v) => v.userId !== newVerification.userId)
    filteredVerifications.push(newVerification)
    saveVerificationsToStorage(filteredVerifications)

    return {
      data: {
        message: "Verification submitted successfully",
        verification: newVerification,
      },
    }
  },

  // 2. GET USER'S VERIFICATION STATUS (User)
  // REAL API (to be enabled later): GET /api/verification/status
  // axios.get('/api/verification/status')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getUserVerification: async () => {
    await delay(400)

    const userStored = localStorage.getItem("user")
    const currentUser = userStored ? JSON.parse(userStored) : { id: "mock-user" }

    const verifications = getVerificationsFromStorage()
    const userVerification = verifications.find((v) => v.userId === currentUser.id || v.userId === currentUser.email)

    return {
      data: userVerification || null,
    }
  },

  // 3. GET ALL VERIFICATIONS (Admin)
  // REAL API (to be enabled later): GET /api/admin/verifications
  // axios.get('/api/admin/verifications', { params })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getAllVerifications: async (params?: { status?: string }) => {
    await delay(400)

    let verifications = getVerificationsFromStorage()

    // Filter by status if provided
    if (params?.status && params.status !== "all") {
      verifications = verifications.filter((v) => v.overallStatus === params.status)
    }

    // Sort by submittedAt desc
    verifications.sort((a, b) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
      return dateB - dateA
    })

    return {
      data: {
        content: verifications,
        totalElements: verifications.length,
      },
    }
  },

  // 4. GET VERIFICATION BY ID (Admin)
  // REAL API (to be enabled later): GET /api/admin/verifications/{id}
  // axios.get(`/api/admin/verifications/${id}`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getById: async (id: string) => {
    await delay(300)

    const verifications = getVerificationsFromStorage()
    const verification = verifications.find((v) => v.verificationId === id)

    if (!verification) {
      throw new Error("Verification not found")
    }

    return { data: verification }
  },

  // 5. APPROVE VERIFICATION (Admin)
  // REAL API (to be enabled later): PUT /api/admin/verifications/{id}/approve
  // axios.put(`/api/admin/verifications/${id}/approve`, { remarks })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  approveVerification: async (id: string, remarks?: string) => {
    await delay(600)

    const verifications = getVerificationsFromStorage()
    const index = verifications.findIndex((v) => v.verificationId === id)

    if (index === -1) {
      throw new Error("Verification not found")
    }

    verifications[index] = {
      ...verifications[index],
      overallStatus: "VERIFIED",
      cnicVerified: true,
      profileVerified: true,
      reviewedBy: "Admin",
      reviewedAt: new Date().toISOString(),
      adminRemarks: remarks || null,
      rejectionReason: null,
      updatedAt: new Date().toISOString(),
    }

    saveVerificationsToStorage(verifications)

    // Sync verification status to registered users service
    try {
      const { mockRegisteredUsersService } = await import("@/services/mockRegisteredUsersService")
      await mockRegisteredUsersService.updateVerificationStatus(verifications[index].userId, true)
    } catch (error) {
      console.error("[Mock Verification Service] Failed to sync verification status:", error)
    }

    return {
      data: {
        message: "Verification approved successfully",
        verification: verifications[index],
      },
    }
  },

  // 6. REJECT VERIFICATION (Admin)
  // REAL API (to be enabled later): PUT /api/admin/verifications/{id}/reject
  // axios.put(`/api/admin/verifications/${id}/reject`, { reason, remarks })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  rejectVerification: async (id: string, reason: string, remarks?: string) => {
    await delay(600)

    const verifications = getVerificationsFromStorage()
    const index = verifications.findIndex((v) => v.verificationId === id)

    if (index === -1) {
      throw new Error("Verification not found")
    }

    verifications[index] = {
      ...verifications[index],
      overallStatus: "REJECTED",
      cnicVerified: false,
      profileVerified: false,
      reviewedBy: "Admin",
      reviewedAt: new Date().toISOString(),
      rejectionReason: reason,
      adminRemarks: remarks || null,
      updatedAt: new Date().toISOString(),
    }

    saveVerificationsToStorage(verifications)

    // Sync verification status to registered users service (set to not verified)
    try {
      const { mockRegisteredUsersService } = await import("@/services/mockRegisteredUsersService")
      await mockRegisteredUsersService.updateVerificationStatus(verifications[index].userId, false)
    } catch (error) {
      console.error("[Mock Verification Service] Failed to sync verification status:", error)
    }

    return {
      data: {
        message: "Verification rejected",
        verification: verifications[index],
      },
    }
  },

  // 7. GET VERIFICATION STATS (Admin)
  // REAL API (to be enabled later): GET /api/admin/verifications/stats
  // axios.get('/api/admin/verifications/stats')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getStats: async () => {
    await delay(300)

    const verifications = getVerificationsFromStorage()

    const totalCount = verifications.length
    const pendingCount = verifications.filter((v) => v.overallStatus === "UNDER_REVIEW").length
    const verifiedCount = verifications.filter((v) => v.overallStatus === "VERIFIED").length
    const rejectedCount = verifications.filter((v) => v.overallStatus === "REJECTED").length
    const avgFaceMatch = verifications.reduce((sum, v) => sum + v.faceMatchScore, 0) / (verifications.length || 1)

    return {
      data: {
        totalVerifications: totalCount,
        pendingVerifications: pendingCount,
        verifiedUsers: verifiedCount,
        rejectedVerifications: rejectedCount,
        averageFaceMatchScore: Math.round(avgFaceMatch * 10) / 10,
      },
    }
  },

  // Helper: Clear all verifications (for testing)
  clearAll: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
    }
  },

  // 8. CHECK IF CURRENT USER IS VERIFIED
  // REAL API (to be enabled later): GET /api/verification/is-verified
  // axios.get('/api/verification/is-verified')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  isCurrentUserVerified: async () => {
    await delay(200)

    const userStored = localStorage.getItem("user")
    if (!userStored) return { data: { verified: false, status: "NOT_VERIFIED" } }

    const currentUser = JSON.parse(userStored)
    const verifications = getVerificationsFromStorage()
    const userVerification = verifications.find((v) => v.userId === currentUser.id || v.userId === currentUser.email)

    if (!userVerification) {
      return { data: { verified: false, status: "NOT_VERIFIED" } }
    }

    return {
      data: {
        verified: userVerification.overallStatus === "VERIFIED",
        status: userVerification.overallStatus,
      },
    }
  },
}

export default mockVerificationService
