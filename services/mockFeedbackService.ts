// ========================================================
// MOCK FEEDBACK SERVICE (localStorage-based)
// ========================================================
// This service simulates the feedback system with localStorage
// as a mock database. It will be replaced with real Spring Boot
// APIs later.
//
// All function signatures and responses MATCH the real backend
// APIs exactly to ensure seamless transition.
// ========================================================

export interface Feedback {
  feedbackId: string
  userId: string
  userName: string
  feedbackType: "BUG_REPORT" | "FEATURE_REQUEST" | "PAYMENT_ISSUE" | "CHAT_ISSUE" | "OTHER"
  rating: number | null
  title: string
  message: string
  createdAt: string
  updatedAt: string
  status: "NEW" | "REVIEWED" | "RESOLVED"
}

const STORAGE_KEY = "mock_feedback"
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper to generate unique IDs
const generateId = (prefix = "fb") => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Get all feedback from localStorage
const getFeedbackFromStorage = (): Feedback[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("[Mock Feedback Service] Error reading from localStorage:", error)
    return []
  }
}

// Save feedback to localStorage
const saveFeedbackToStorage = (feedbackList: Feedback[]) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbackList))
  } catch (error) {
    console.error("[Mock Feedback Service] Failed to save to localStorage:", error)
  }
}

// ========================================================
// MOCK FEEDBACK API IMPLEMENTATIONS
// ========================================================

export const mockFeedbackService = {
  // 1. SUBMIT FEEDBACK (User)
  // REAL API (to be enabled later): POST /api/feedback
  // axios.post('/api/feedback', data)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  submit: async (data: {
    feedbackType: Feedback["feedbackType"]
    rating: number | null
    title: string
    message: string
  }) => {
    await delay(600)

    // Get current user from localStorage
    const userStored = localStorage.getItem("user")
    const currentUser = userStored ? JSON.parse(userStored) : { id: "mock-user", username: "Mock User" }

    const newFeedback: Feedback = {
      feedbackId: generateId("fb"),
      userId: currentUser.id || currentUser.email || "unknown",
      userName: currentUser.username || currentUser.name || "Unknown User",
      feedbackType: data.feedbackType,
      rating: data.rating,
      title: data.title,
      message: data.message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "NEW",
    }

    const feedbackList = getFeedbackFromStorage()
    feedbackList.push(newFeedback)
    saveFeedbackToStorage(feedbackList)

    return {
      data: {
        message: "Feedback submitted successfully",
        feedback: newFeedback,
      },
    }
  },

  // 2. GET USER'S FEEDBACK
  // REAL API (to be enabled later): GET /api/feedback/user
  // axios.get('/api/feedback/user')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getUserFeedback: async () => {
    await delay(400)

    const userStored = localStorage.getItem("user")
    const currentUser = userStored ? JSON.parse(userStored) : { id: "mock-user" }

    const feedbackList = getFeedbackFromStorage()
    const userFeedback = feedbackList.filter((f) => f.userId === currentUser.id || f.userId === currentUser.email)

    // Sort by createdAt desc
    userFeedback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return {
      data: {
        content: userFeedback,
        totalElements: userFeedback.length,
      },
    }
  },

  // 3. GET ALL FEEDBACK (Admin)
  // REAL API (to be enabled later): GET /api/admin/feedback
  // axios.get('/api/admin/feedback', { params })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getAllFeedback: async (params?: { page?: number; size?: number; status?: string }) => {
    await delay(400)

    let feedbackList = getFeedbackFromStorage()

    // Filter by status if provided
    if (params?.status && params.status !== "all") {
      feedbackList = feedbackList.filter((f) => f.status === params.status)
    }

    // Sort by createdAt desc
    feedbackList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const page = params?.page || 0
    const size = params?.size || 20
    const start = page * size
    const end = start + size
    const paginatedFeedback = feedbackList.slice(start, end)

    return {
      data: {
        content: paginatedFeedback,
        totalElements: feedbackList.length,
        totalPages: Math.ceil(feedbackList.length / size),
        currentPage: page,
      },
    }
  },

  // 4. GET FEEDBACK BY ID (Admin)
  // REAL API (to be enabled later): GET /api/admin/feedback/{id}
  // axios.get(`/api/admin/feedback/${id}`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getById: async (id: string) => {
    await delay(300)

    const feedbackList = getFeedbackFromStorage()
    const feedback = feedbackList.find((f) => f.feedbackId === id)

    if (!feedback) {
      throw new Error("Feedback not found")
    }

    return { data: feedback }
  },

  // 5. UPDATE FEEDBACK STATUS (Admin)
  // REAL API (to be enabled later): PUT /api/admin/feedback/{id}/status
  // axios.put(`/api/admin/feedback/${id}/status`, { status })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  updateStatus: async (id: string, status: Feedback["status"]) => {
    await delay(500)

    const feedbackList = getFeedbackFromStorage()
    const index = feedbackList.findIndex((f) => f.feedbackId === id)

    if (index === -1) {
      throw new Error("Feedback not found")
    }

    feedbackList[index] = {
      ...feedbackList[index],
      status,
      updatedAt: new Date().toISOString(),
    }

    saveFeedbackToStorage(feedbackList)

    return {
      data: {
        message: "Status updated successfully",
        feedback: feedbackList[index],
      },
    }
  },

  // 6. GET FEEDBACK STATS (Admin)
  // REAL API (to be enabled later): GET /api/admin/feedback/stats
  // axios.get('/api/admin/feedback/stats')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getStats: async () => {
    await delay(300)

    const feedbackList = getFeedbackFromStorage()

    const totalCount = feedbackList.length
    const newCount = feedbackList.filter((f) => f.status === "NEW").length
    const reviewedCount = feedbackList.filter((f) => f.status === "REVIEWED").length
    const resolvedCount = feedbackList.filter((f) => f.status === "RESOLVED").length
    const avgRating =
      feedbackList.filter((f) => f.rating !== null).reduce((sum, f) => sum + (f.rating || 0), 0) /
        (feedbackList.filter((f) => f.rating !== null).length || 1) || 0

    return {
      data: {
        totalFeedback: totalCount,
        newFeedback: newCount,
        reviewedFeedback: reviewedCount,
        resolvedFeedback: resolvedCount,
        averageRating: Math.round(avgRating * 10) / 10,
      },
    }
  },

  // Helper: Clear all feedback (for testing)
  clearAll: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
    }
  },
}

export default mockFeedbackService
