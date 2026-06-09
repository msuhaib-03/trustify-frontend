// Storage keys used by various services
const STORAGE_KEYS = {
  // Users are now managed by mockRegisteredUsersService - use its key for synchronization
  users: "mock_registered_users",
  listings: "mock_listings",
  transactions: "mock_transactions",
  disputes: "mock_disputes",
  fraudAlerts: "mock_fraud_alerts",
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper to safely get data from localStorage
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.error(`[Dashboard Stats Service] Error reading ${key}:`, error)
    return defaultValue
  }
}

// Users are now managed by mockRegisteredUsersService
// NO initialization here - we read from the centralized service's storage

// Initialize default listings if not exists
const initializeDefaultListings = () => {
  if (typeof window === "undefined") return
  const existingListings = getFromStorage<any[]>(STORAGE_KEYS.listings, [])
  if (existingListings.length === 0) {
    const defaultListings = [
      { id: "listing-1", title: "iPhone 15 Pro", status: "ACTIVE", price: 119900, createdAt: "2024-10-01T10:00:00Z" },
      { id: "listing-2", title: "MacBook Pro M3", status: "ACTIVE", price: 249900, createdAt: "2024-10-05T14:30:00Z" },
      { id: "listing-3", title: "Sony WH-1000XM5", status: "ACTIVE", price: 34900, createdAt: "2024-10-10T09:15:00Z" },
      {
        id: "listing-4",
        title: "Samsung Galaxy S24",
        status: "ACTIVE",
        price: 89900,
        createdAt: "2024-10-15T11:20:00Z",
      },
      { id: "listing-5", title: "iPad Air", status: "INACTIVE", price: 69900, createdAt: "2024-10-20T08:45:00Z" },
      { id: "listing-6", title: "Nintendo Switch", status: "ACTIVE", price: 29900, createdAt: "2024-10-25T16:00:00Z" },
    ]
    localStorage.setItem(STORAGE_KEYS.listings, JSON.stringify(defaultListings))
  }
}

// Initialize default fraud alerts if not exists
const initializeDefaultFraudAlerts = () => {
  if (typeof window === "undefined") return
  const existingAlerts = getFromStorage<any[]>(STORAGE_KEYS.fraudAlerts, [])
  if (existingAlerts.length === 0) {
    const defaultAlerts = [
      {
        id: "fraud-1",
        type: "SUSPICIOUS_LISTING",
        severity: "HIGH",
        status: "PENDING",
        createdAt: "2024-11-01T10:00:00Z",
      },
      {
        id: "fraud-2",
        type: "UNUSUAL_ACTIVITY",
        severity: "MEDIUM",
        status: "PENDING",
        createdAt: "2024-11-05T14:30:00Z",
      },
      { id: "fraud-3", type: "REPORTED_USER", severity: "LOW", status: "RESOLVED", createdAt: "2024-11-10T09:15:00Z" },
    ]
    localStorage.setItem(STORAGE_KEYS.fraudAlerts, JSON.stringify(defaultAlerts))
  }
}

// ========================================================
// MOCK DASHBOARD STATS API IMPLEMENTATIONS
// ========================================================

export const mockDashboardStatsService = {
  // 1. GET ALL DASHBOARD STATS
  // REAL API (to be enabled later): GET /api/admin/dashboard/stats
  // axios.get('/api/admin/dashboard/stats')
  // MOCK IMPLEMENTATION (temporary - aggregates from all localStorage sources)
  getAllStats: async () => {
    await delay(400)

    // Initialize default data if needed (except users - managed by mockRegisteredUsersService)
    initializeDefaultListings()
    initializeDefaultFraudAlerts()

    // Get users data from centralized registered users service storage
    const users = getFromStorage<any[]>(STORAGE_KEYS.users, [])
    const totalUsers = users.length
    const verifiedUsers = users.filter((u) => u.verified === true).length

    // Get listings data
    const listings = getFromStorage<any[]>(STORAGE_KEYS.listings, [])
    const activeListings = listings.filter((l) => l.status === "ACTIVE").length

    // Get transactions data
    const transactions = getFromStorage<any[]>(STORAGE_KEYS.transactions, [])
    const totalTransactions = transactions.length

    // Calculate monthly revenue (only COMPLETED transactions from current month)
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const monthlyRevenue = transactions
      .filter((t) => {
        const txnDate = new Date(t.createdAt)
        return t.status === "COMPLETED" && txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear
      })
      .reduce((sum, t) => sum + (t.amountCents || 0), 0)

    // Get disputes data
    const disputes = getFromStorage<any[]>(STORAGE_KEYS.disputes, [])
    const pendingDisputes = disputes.filter((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW").length

    // Get fraud alerts data
    const fraudAlerts = getFromStorage<any[]>(STORAGE_KEYS.fraudAlerts, [])
    const activeFraudAlerts = fraudAlerts.filter((f) => f.status === "PENDING").length

    return {
      data: {
        totalUsers,
        verifiedUsers,
        activeListings,
        totalTransactions,
        pendingDisputes,
        monthlyRevenue,
        fraudAlerts: activeFraudAlerts,
      },
    }
  },

  // 2. GET TOTAL USERS COUNT
  // REAL API (to be enabled later): GET /api/admin/users/count
  // axios.get('/api/admin/users/count')
  // MOCK IMPLEMENTATION (temporary - uses centralized registered users storage)
  getTotalUsers: async () => {
    await delay(200)
    // Read from centralized registered users service storage
    const users = getFromStorage<any[]>(STORAGE_KEYS.users, [])
    return { data: { count: users.length } }
  },

  // 3. GET ACTIVE LISTINGS COUNT
  // REAL API (to be enabled later): GET /api/admin/listings/active/count
  // axios.get('/api/admin/listings/active/count')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getActiveListings: async () => {
    await delay(200)
    initializeDefaultListings()
    const listings = getFromStorage<any[]>(STORAGE_KEYS.listings, [])
    const activeCount = listings.filter((l) => l.status === "ACTIVE").length
    return { data: { count: activeCount } }
  },

  // 4. GET TOTAL TRANSACTIONS COUNT
  // REAL API (to be enabled later): GET /api/admin/transactions/count
  // axios.get('/api/admin/transactions/count')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getTotalTransactions: async () => {
    await delay(200)
    const transactions = getFromStorage<any[]>(STORAGE_KEYS.transactions, [])
    return { data: { count: transactions.length } }
  },

  // 5. GET PENDING DISPUTES COUNT
  // REAL API (to be enabled later): GET /api/admin/disputes/pending/count
  // axios.get('/api/admin/disputes/pending/count')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getPendingDisputes: async () => {
    await delay(200)
    const disputes = getFromStorage<any[]>(STORAGE_KEYS.disputes, [])
    const pendingCount = disputes.filter((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW").length
    return { data: { count: pendingCount } }
  },

  // 6. GET MONTHLY REVENUE
  // REAL API (to be enabled later): GET /api/admin/transactions/revenue/monthly
  // axios.get('/api/admin/transactions/revenue/monthly')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getMonthlyRevenue: async () => {
    await delay(200)
    const transactions = getFromStorage<any[]>(STORAGE_KEYS.transactions, [])

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyRevenue = transactions
      .filter((t) => {
        const txnDate = new Date(t.createdAt)
        return t.status === "COMPLETED" && txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear
      })
      .reduce((sum, t) => sum + (t.amountCents || 0), 0)

    return { data: { revenueCents: monthlyRevenue } }
  },

  // 7. GET FRAUD ALERTS COUNT
  // REAL API (to be enabled later): GET /api/admin/fraud/alerts/count
  // axios.get('/api/admin/fraud/alerts/count')
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  getFraudAlerts: async () => {
    await delay(200)
    initializeDefaultFraudAlerts()
    const fraudAlerts = getFromStorage<any[]>(STORAGE_KEYS.fraudAlerts, [])
    const activeCount = fraudAlerts.filter((f) => f.status === "PENDING").length
    return { data: { count: activeCount } }
  },

  // 8. REGISTER USER - DEPRECATED
  // User registration is now handled by mockRegisteredUsersService
  // This function is kept for backwards compatibility but redirects to the centralized service
  // REAL API (to be enabled later): POST /api/users/register
  // axios.post('/api/users/register', userData)
  registerUser: async (userData: { username: string; email: string }) => {
    await delay(300)
    // Import dynamically to avoid circular dependency
    const { mockRegisteredUsersService } = await import("@/services/mockRegisteredUsersService")
    return mockRegisteredUsersService.createUser({ ...userData, password: "temp123" })
  },

  // 9. CREATE LISTING (Updates listing count)
  // REAL API (to be enabled later): POST /api/listings
  // axios.post('/api/listings', listingData)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  createListing: async (listingData: { title: string; price: number }) => {
    await delay(300)
    initializeDefaultListings()
    const listings = getFromStorage<any[]>(STORAGE_KEYS.listings, [])

    const newListing = {
      id: `listing-${Date.now()}`,
      title: listingData.title,
      price: listingData.price,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    }

    listings.push(newListing)
    localStorage.setItem(STORAGE_KEYS.listings, JSON.stringify(listings))

    return { data: { listing: newListing, message: "Listing created successfully" } }
  },

  // 10. ADD FRAUD ALERT
  // REAL API (to be enabled later): POST /api/admin/fraud/alerts
  // axios.post('/api/admin/fraud/alerts', alertData)
  // MOCK IMPLEMENTATION (temporary - uses localStorage)
  addFraudAlert: async (alertData: { type: string; severity: string }) => {
    await delay(300)
    initializeDefaultFraudAlerts()
    const fraudAlerts = getFromStorage<any[]>(STORAGE_KEYS.fraudAlerts, [])

    const newAlert = {
      id: `fraud-${Date.now()}`,
      type: alertData.type,
      severity: alertData.severity,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    }

    fraudAlerts.push(newAlert)
    localStorage.setItem(STORAGE_KEYS.fraudAlerts, JSON.stringify(fraudAlerts))

    return { data: { alert: newAlert, message: "Fraud alert created successfully" } }
  },

  // Helper: Clear all stats data (for testing)
  clearAll: () => {
    if (typeof window !== "undefined") {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
    }
  },
}

export default mockDashboardStatsService
