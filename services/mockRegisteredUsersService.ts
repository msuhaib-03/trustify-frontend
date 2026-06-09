// ========================================================
// MOCK REGISTERED USERS SERVICE (localStorage-based)
// ========================================================
// This service simulates the users database with localStorage
// as a mock database. It will be replaced with real Spring Boot
// APIs later.
//
// All function signatures and responses MATCH the real backend
// APIs exactly to ensure seamless transition.
// ========================================================

export interface RegisteredUser {
  id: string
  username: string
  email: string
  password: string // Stored for mock validation (would be hashed in real backend)
  role: "USER" | "ADMIN"
  status: "ACTIVE" | "SUSPENDED"
  verified: boolean
  fraudScore: number
  trustRating: number
  createdAt: string
  lastActive: string
}

// Public user data (without password) for API responses
export type PublicUser = Omit<RegisteredUser, "password">

const STORAGE_KEY = "mock_registered_users"
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper to generate unique IDs
const generateId = () => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Helper to remove password from user object for public responses
const toPublicUser = (user: RegisteredUser): PublicUser => {
  const { password, ...publicUser } = user
  return publicUser
}

// Seed data - only used on first initialization
const seedUsers: RegisteredUser[] = [
  {
    id: "admin-1",
    username: "admin",
    email: "admin@trustify.com",
    password: "admin123", // Admin password
    role: "ADMIN",
    status: "ACTIVE",
    verified: true,
    fraudScore: 0,
    trustRating: 5.0,
    createdAt: "2024-01-01T00:00:00Z",
    lastActive: new Date().toISOString(),
  },
]

// Get all users from localStorage
const getUsersFromStorage = (): RegisteredUser[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      // Initialize with seed data on first run
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedUsers))
      return seedUsers
    }
    
    const users = JSON.parse(stored) as RegisteredUser[]
    
    // Ensure admin user always exists with correct credentials
    const adminExists = users.find((u) => u.email.toLowerCase() === "admin@trustify.com")
    if (!adminExists) {
      // Admin was removed - re-add from seed data
      users.push(seedUsers[0])
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
    } else if (adminExists.role !== "ADMIN" || adminExists.password !== "admin123") {
      // Admin exists but has wrong role or password - fix it
      const adminIndex = users.findIndex((u) => u.email.toLowerCase() === "admin@trustify.com")
      users[adminIndex] = { ...users[adminIndex], role: "ADMIN", password: "admin123" }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
    }
    
    return users
  } catch (error) {
    console.error("[Mock Registered Users Service] Error reading from localStorage:", error)
    return seedUsers
  }
}

// Save users to localStorage
const saveUsersToStorage = (users: RegisteredUser[]) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch (error) {
    console.error("[Mock Registered Users Service] Failed to save to localStorage:", error)
  }
}

// ========================================================
// MOCK REGISTERED USERS API IMPLEMENTATIONS
// ========================================================

export const mockRegisteredUsersService = {
  // 1. CREATE NEW USER (Sign-Up)
  // REAL API (to be enabled later): POST /api/auth/signup
  // axios.post('/api/auth/signup', data)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  createUser: async (data: { username: string; email: string; password: string }) => {
    await delay(500)

    const users = getUsersFromStorage()

    // Check if email already exists
    const existingUser = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase())
    if (existingUser) {
      throw new Error("Email already registered")
    }

    // Check if username already exists
    const existingUsername = users.find((u) => u.username.toLowerCase() === data.username.toLowerCase())
    if (existingUsername) {
      throw new Error("Username already taken")
    }

    const newUser: RegisteredUser = {
      id: generateId(),
      username: data.username,
      email: data.email,
      password: data.password, // Store password for mock validation
      role: "USER",
      status: "ACTIVE",
      verified: false,
      fraudScore: 0,
      trustRating: 5.0,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    }

    users.push(newUser)
    saveUsersToStorage(users)

    return {
      data: {
        message: "User registered successfully",
        user: toPublicUser(newUser),
      },
    }
  },

  // 2. VALIDATE CREDENTIALS (Login)
  // REAL API (to be enabled later): POST /api/auth/login
  // axios.post('/api/auth/login', { email, password })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  validateCredentials: async (email: string, password: string) => {
    await delay(400)

    const users = getUsersFromStorage()
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

    // Case 1: Email not found
    if (!user) {
      return {
        success: false,
        errorCode: "USER_NOT_FOUND",
        message: "This account does not exist. Please sign up first.",
      }
    }

    // Case 2: Wrong password - provide role-specific error message
    if (user.password !== password) {
      // If admin email with wrong password, show specific admin error
      if (user.role === "ADMIN") {
        return {
          success: false,
          errorCode: "INVALID_ADMIN_PASSWORD",
          message: "Invalid admin credentials",
        }
      }
      return {
        success: false,
        errorCode: "INVALID_PASSWORD",
        message: "Invalid email or password",
      }
    }

    // Case 3: Account suspended
    if (user.status === "SUSPENDED") {
      return {
        success: false,
        errorCode: "ACCOUNT_SUSPENDED",
        message: "Your account has been suspended. Please contact support.",
      }
    }

    // Case 4: Success - update last active
    user.lastActive = new Date().toISOString()
    saveUsersToStorage(users)

    return {
      success: true,
      user: toPublicUser(user),
    }
  },

  // 3. GET ALL USERS (Admin)
  // REAL API (to be enabled later): GET /api/admin/users
  // axios.get('/api/admin/users', { params })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getAllUsers: async (params?: { page?: number; size?: number; status?: string; search?: string }) => {
    await delay(400)

    let users = getUsersFromStorage()

    // Filter by status if provided
    if (params?.status && params.status !== "all") {
      users = users.filter((u) => u.status === params.status)
    }

    // Filter by search query
    if (params?.search) {
      const query = params.search.toLowerCase()
      users = users.filter(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query)
      )
    }

    // Sort by createdAt desc (newest first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const page = params?.page || 0
    const size = params?.size || 50
    const start = page * size
    const end = start + size
    const paginatedUsers = users.slice(start, end).map(toPublicUser)

    return {
      data: {
        content: paginatedUsers,
        totalElements: users.length,
        totalPages: Math.ceil(users.length / size),
        currentPage: page,
      },
    }
  },

  // 4. GET USER BY ID
  // REAL API (to be enabled later): GET /api/admin/users/{id}
  // axios.get(`/api/admin/users/${id}`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getUserById: async (id: string) => {
    await delay(300)

    const users = getUsersFromStorage()
    const user = users.find((u) => u.id === id)

    if (!user) {
      throw new Error("User not found")
    }

    return { data: toPublicUser(user) }
  },

  // 5. GET USER BY EMAIL (for login validation)
  // REAL API (to be enabled later): GET /api/users/email/{email}
  // axios.get(`/api/users/email/${email}`)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getUserByEmail: async (email: string) => {
    await delay(200)

    const users = getUsersFromStorage()
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

    return { data: user ? toPublicUser(user) : null }
  },

  // 5. UPDATE USER STATUS (Suspend/Activate)
  // REAL API (to be enabled later): PUT /api/admin/users/{id}/status
  // axios.put(`/api/admin/users/${id}/status`, { status })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  updateUserStatus: async (id: string, status: "ACTIVE" | "SUSPENDED") => {
    await delay(400)

    const users = getUsersFromStorage()
    const index = users.findIndex((u) => u.id === id)

    if (index === -1) {
      throw new Error("User not found")
    }

    users[index] = {
      ...users[index],
      status,
      lastActive: new Date().toISOString(),
    }

    saveUsersToStorage(users)

    return {
      data: {
        message: `User ${status === "SUSPENDED" ? "suspended" : "activated"} successfully`,
        user: users[index],
      },
    }
  },

  // 6. UPDATE USER VERIFICATION STATUS
  // REAL API (to be enabled later): PUT /api/admin/users/{id}/verify
  // axios.put(`/api/admin/users/${id}/verify`, { verified })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  updateVerificationStatus: async (id: string, verified: boolean) => {
    await delay(400)

    const users = getUsersFromStorage()
    const index = users.findIndex((u) => u.id === id)

    if (index === -1) {
      throw new Error("User not found")
    }

    users[index] = {
      ...users[index],
      verified,
      lastActive: new Date().toISOString(),
    }

    saveUsersToStorage(users)

    return {
      data: {
        message: `User verification ${verified ? "approved" : "revoked"} successfully`,
        user: users[index],
      },
    }
  },

  // 7. UPDATE USER FRAUD SCORE
  // REAL API (to be enabled later): PUT /api/admin/users/{id}/fraud-score
  // axios.put(`/api/admin/users/${id}/fraud-score`, { fraudScore })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  updateFraudScore: async (id: string, fraudScore: number) => {
    await delay(400)

    const users = getUsersFromStorage()
    const index = users.findIndex((u) => u.id === id)

    if (index === -1) {
      throw new Error("User not found")
    }

    users[index] = {
      ...users[index],
      fraudScore: Math.max(0, Math.min(100, fraudScore)),
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

  // 8. UPDATE USER TRUST RATING
  // REAL API (to be enabled later): PUT /api/admin/users/{id}/trust-rating
  // axios.put(`/api/admin/users/${id}/trust-rating`, { trustRating })
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  updateTrustRating: async (id: string, trustRating: number) => {
    await delay(400)

    const users = getUsersFromStorage()
    const index = users.findIndex((u) => u.id === id)

    if (index === -1) {
      throw new Error("User not found")
    }

    users[index] = {
      ...users[index],
      trustRating: Math.max(1.0, Math.min(5.0, trustRating)),
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

  // 9. GET USER STATS (Admin Dashboard)
  // REAL API (to be enabled later): GET /api/admin/users/stats
  // axios.get('/api/admin/users/stats')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getStats: async () => {
    await delay(300)

    const users = getUsersFromStorage()

    const totalUsers = users.filter((u) => u.role === "USER").length
    const activeUsers = users.filter((u) => u.status === "ACTIVE" && u.role === "USER").length
    const suspendedUsers = users.filter((u) => u.status === "SUSPENDED").length
    const verifiedUsers = users.filter((u) => u.verified && u.role === "USER").length
    const highRiskUsers = users.filter((u) => u.fraudScore >= 70).length

    return {
      data: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        verifiedUsers,
        highRiskUsers,
      },
    }
  },

  // Helper: Reset to seed data (for testing)
  resetToSeedData: () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedUsers))
    }
  },

  // Helper: Clear all users (for testing)
  clearAll: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY)
    }
  },
}

export default mockRegisteredUsersService
