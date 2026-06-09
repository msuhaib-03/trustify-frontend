// Mock API - Complete replacement for real backend APIs
// This file provides mock data for the entire application
// Replace imports from '@/lib/api' with '@/lib/mock-api' when testing

// Types
export interface User {
  id: string
  username: string
  email: string
  role: "USER" | "ADMIN"
  status: "ACTIVE" | "SUSPENDED" | "PENDING"
  profileImage?: string
  createdAt: string
  phone?: string
  location?: string
  bio?: string
}

export interface Listing {
  id: string
  title: string
  description: string
  price: number
  category: string
  condition: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR"
  images: string[]
  imageUrls: string[] // Added imageUrls for compatibility with pages expecting this field
  type: "SALE" | "RENT" // Added type field to differentiate between sale and rent listings
  sellerId: string
  sellerName: string
  sellerImage?: string
  status: "ACTIVE" | "SOLD" | "PENDING" | "REJECTED"
  createdAt: string
  updatedAt: string
  location?: string
  isFavorite?: boolean
}

export interface Transaction {
  id: string
  listingId: string
  listing: Listing
  buyerId: string
  buyerName: string
  sellerId: string
  sellerName: string
  amountCents: number
  status: "PENDING" | "AUTHORIZED" | "CAPTURED" | "REFUNDED" | "DISPUTED" | "COMPLETED"
  stripePaymentIntentId?: string
  createdAt: string
  updatedAt: string
  note?: string
  dispute?: {
    reason: string
    message: string
    status: "OPEN" | "RESOLVED"
    resolution?: string
  }
}

export interface ChatSummary {
  chatId: string
  recipientId: string
  recipientName: string
  recipientImage?: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  senderName: string
  content: string
  createdAt: string
  read: boolean
}

export interface Report {
  id: string
  reporterId: string
  reporterName: string
  targetType: "USER" | "LISTING" | "TRANSACTION"
  targetId: string
  reason: string
  description: string
  status: "PENDING" | "REVIEWED" | "RESOLVED"
  createdAt: string
  resolvedAt?: string
  resolution?: string
}

// Mock Data Storage
const mockUsers: User[] = [
  {
    id: "user-1",
    username: "john_doe",
    email: "john@example.com",
    role: "USER",
    status: "ACTIVE",
    profileImage: "/male-user-avatar.png",
    createdAt: "2024-01-15T10:00:00Z",
    phone: "+1234567890",
    location: "New York, USA",
    bio: "Tech enthusiast and gadget lover",
  },
  {
    id: "user-2",
    username: "jane_smith",
    email: "jane@example.com",
    role: "USER",
    status: "ACTIVE",
    profileImage: "/female-user-avatar.png",
    createdAt: "2024-02-20T14:30:00Z",
    phone: "+0987654321",
    location: "Los Angeles, USA",
    bio: "Fashion designer and vintage collector",
  },
  {
    id: "user-3",
    username: "mike_wilson",
    email: "mike@example.com",
    role: "USER",
    status: "SUSPENDED",
    createdAt: "2024-03-10T09:15:00Z",
    location: "Chicago, USA",
  },
  {
    id: "admin-1",
    username: "admin",
    email: "admin@trustify.com",
    role: "ADMIN",
    status: "ACTIVE",
    createdAt: "2024-01-01T00:00:00Z",
  },
]

const mockListings: Listing[] = [
  {
    id: "listing-1",
    title: "iPhone 15 Pro Max - 256GB",
    description:
      "Brand new iPhone 15 Pro Max in Natural Titanium. Unopened box with full warranty. Purchased directly from Apple Store.",
    price: 119900,
    category: "Electronics",
    condition: "NEW",
    images: ["/iphone-15-pro-max.png"],
    imageUrls: ["/iphone-15-pro-max.png"],
    type: "SALE",
    sellerId: "user-1",
    sellerName: "john_doe",
    sellerImage: "/male-avatar.png",
    status: "ACTIVE",
    createdAt: "2024-11-01T10:00:00Z",
    updatedAt: "2024-11-01T10:00:00Z",
    location: "New York, USA",
    isFavorite: false,
  },
  {
    id: "listing-2",
    title: 'MacBook Pro 14" M3 Pro',
    description:
      "MacBook Pro 14-inch with M3 Pro chip, 18GB RAM, 512GB SSD. Space Black. Excellent condition, used for only 3 months.",
    price: 189900,
    category: "Electronics",
    condition: "LIKE_NEW",
    images: ["/macbook-pro.png"],
    imageUrls: ["/macbook-pro.png"],
    type: "SALE",
    sellerId: "user-2",
    sellerName: "jane_smith",
    sellerImage: "/diverse-female-avatar.png",
    status: "ACTIVE",
    createdAt: "2024-10-28T14:30:00Z",
    updatedAt: "2024-10-28T14:30:00Z",
    location: "Los Angeles, USA",
    isFavorite: true,
  },
  {
    id: "listing-3",
    title: "Sony PlayStation 5",
    description:
      "PS5 Disc Edition with 2 controllers and 5 games. Perfect working condition. Includes original box and all cables.",
    price: 45000,
    category: "Electronics",
    condition: "GOOD",
    images: ["/playstation-5-gaming-console.jpg"],
    imageUrls: ["/playstation-5-gaming-console.jpg"],
    type: "RENT",
    sellerId: "user-1",
    sellerName: "john_doe",
    sellerImage: "/male-avatar.png",
    status: "ACTIVE",
    createdAt: "2024-10-25T09:15:00Z",
    updatedAt: "2024-10-25T09:15:00Z",
    location: "New York, USA",
    isFavorite: false,
  },
  {
    id: "listing-4",
    title: "Designer Leather Handbag",
    description:
      "Authentic Louis Vuitton Neverfull MM in Monogram Canvas. Comes with dust bag and authenticity certificate.",
    price: 125000,
    category: "Fashion",
    condition: "LIKE_NEW",
    images: ["/luxury-designer-handbag.jpg"],
    imageUrls: ["/luxury-designer-handbag.jpg"],
    type: "SALE",
    sellerId: "user-2",
    sellerName: "jane_smith",
    sellerImage: "/diverse-female-avatar.png",
    status: "ACTIVE",
    createdAt: "2024-10-20T16:45:00Z",
    updatedAt: "2024-10-20T16:45:00Z",
    location: "Los Angeles, USA",
    isFavorite: false,
  },
  {
    id: "listing-5",
    title: "Canon EOS R5 Camera Body",
    description:
      "Professional mirrorless camera with 45MP full-frame sensor. Low shutter count (5,000). Includes extra battery.",
    price: 289900,
    category: "Electronics",
    condition: "GOOD",
    images: ["/canon-professional-camera.jpg"],
    imageUrls: ["/canon-professional-camera.jpg"],
    type: "RENT",
    sellerId: "user-1",
    sellerName: "john_doe",
    sellerImage: "/male-avatar.png",
    status: "ACTIVE",
    createdAt: "2024-10-15T11:20:00Z",
    updatedAt: "2024-10-15T11:20:00Z",
    location: "New York, USA",
    isFavorite: true,
  },
  {
    id: "listing-6",
    title: "Vintage Rolex Submariner",
    description: "1990 Rolex Submariner Date ref. 16610. Full set with box and papers. Recently serviced by Rolex.",
    price: 899900,
    category: "Fashion",
    condition: "GOOD",
    images: ["/rolex-submariner-watch.jpg"],
    imageUrls: ["/rolex-submariner-watch.jpg"],
    type: "SALE",
    sellerId: "user-2",
    sellerName: "jane_smith",
    sellerImage: "/diverse-female-avatar.png",
    status: "ACTIVE",
    createdAt: "2024-10-10T08:00:00Z",
    updatedAt: "2024-10-10T08:00:00Z",
    location: "Los Angeles, USA",
    isFavorite: false,
  },
  {
    id: "listing-7",
    title: "Herman Miller Aeron Chair",
    description: "Size B, fully loaded with all adjustments. Remastered version. Perfect for home office.",
    price: 89900,
    category: "Furniture",
    condition: "LIKE_NEW",
    images: ["/herman-miller-office-chair.jpg"],
    imageUrls: ["/herman-miller-office-chair.jpg"],
    type: "SALE",
    sellerId: "user-1",
    sellerName: "john_doe",
    sellerImage: "/male-avatar.png",
    status: "ACTIVE",
    createdAt: "2024-10-05T13:30:00Z",
    updatedAt: "2024-10-05T13:30:00Z",
    location: "New York, USA",
    isFavorite: false,
  },
  {
    id: "listing-8",
    title: "DJI Mavic 3 Pro Drone",
    description:
      "Fly More Combo with 3 batteries, ND filters, and carrying case. Excellent condition with low flight hours.",
    price: 179900,
    category: "Electronics",
    condition: "LIKE_NEW",
    images: ["/dji-drone-flying.jpg"],
    imageUrls: ["/dji-drone-flying.jpg"],
    type: "RENT",
    sellerId: "user-2",
    sellerName: "jane_smith",
    sellerImage: "/diverse-female-avatar.png",
    status: "ACTIVE",
    createdAt: "2024-10-01T10:45:00Z",
    updatedAt: "2024-10-01T10:45:00Z",
    location: "Los Angeles, USA",
    isFavorite: false,
  },
]

const mockTransactions: Transaction[] = [
  {
    id: "txn-1",
    listingId: "listing-1",
    listing: mockListings[0],
    buyerId: "user-2",
    buyerName: "jane_smith",
    sellerId: "user-1",
    sellerName: "john_doe",
    amountCents: 119900,
    status: "COMPLETED",
    stripePaymentIntentId: "pi_test_123",
    createdAt: "2024-11-10T14:00:00Z",
    updatedAt: "2024-11-12T10:00:00Z",
  },
  {
    id: "txn-2",
    listingId: "listing-2",
    listing: mockListings[1],
    buyerId: "user-1",
    buyerName: "john_doe",
    sellerId: "user-2",
    sellerName: "jane_smith",
    amountCents: 189900,
    status: "AUTHORIZED",
    stripePaymentIntentId: "pi_test_456",
    createdAt: "2024-11-14T09:30:00Z",
    updatedAt: "2024-11-14T09:30:00Z",
  },
  {
    id: "txn-3",
    listingId: "listing-3",
    listing: mockListings[2],
    buyerId: "user-2",
    buyerName: "jane_smith",
    sellerId: "user-1",
    sellerName: "john_doe",
    amountCents: 45000,
    status: "DISPUTED",
    stripePaymentIntentId: "pi_test_789",
    createdAt: "2024-11-08T16:15:00Z",
    updatedAt: "2024-11-13T11:00:00Z",
    dispute: {
      reason: "Item not as described",
      message: "The PS5 has scratches that were not mentioned in the listing",
      status: "OPEN",
    },
  },
]

const mockChatSummaries: ChatSummary[] = [
  {
    chatId: "chat-1",
    recipientId: "user-2",
    recipientName: "jane_smith",
    recipientImage: "/diverse-female-avatar.png",
    lastMessage: "Thanks for the quick response!",
    lastMessageTime: "2024-11-14T15:30:00Z",
    unreadCount: 2,
  },
  {
    chatId: "chat-2",
    recipientId: "user-1",
    recipientName: "john_doe",
    recipientImage: "/male-avatar.png",
    lastMessage: "Is the iPhone still available?",
    lastMessageTime: "2024-11-14T12:00:00Z",
    unreadCount: 0,
  },
]

const mockMessages: Message[] = [
  {
    id: "msg-1",
    chatId: "chat-1",
    senderId: "user-1",
    senderName: "john_doe",
    content: "Hi! I'm interested in the MacBook Pro. Is it still available?",
    createdAt: "2024-11-14T14:00:00Z",
    read: true,
  },
  {
    id: "msg-2",
    chatId: "chat-1",
    senderId: "user-2",
    senderName: "jane_smith",
    content: "Yes, it's still available! Would you like to see more photos?",
    createdAt: "2024-11-14T14:15:00Z",
    read: true,
  },
  {
    id: "msg-3",
    chatId: "chat-1",
    senderId: "user-1",
    senderName: "john_doe",
    content: "That would be great! Can you also tell me about the battery health?",
    createdAt: "2024-11-14T14:30:00Z",
    read: true,
  },
  {
    id: "msg-4",
    chatId: "chat-1",
    senderId: "user-2",
    senderName: "jane_smith",
    content: "Battery health is at 94%. I'll send the photos shortly.",
    createdAt: "2024-11-14T15:00:00Z",
    read: false,
  },
  {
    id: "msg-5",
    chatId: "chat-1",
    senderId: "user-2",
    senderName: "jane_smith",
    content: "Thanks for the quick response!",
    createdAt: "2024-11-14T15:30:00Z",
    read: false,
  },
]

const mockReports: Report[] = [
  {
    id: "report-1",
    reporterId: "user-2",
    reporterName: "jane_smith",
    targetType: "LISTING",
    targetId: "listing-3",
    reason: "Misleading description",
    description: "The listing claims the item is brand new but it clearly shows signs of use.",
    status: "PENDING",
    createdAt: "2024-11-12T10:00:00Z",
  },
  {
    id: "report-2",
    reporterId: "user-1",
    reporterName: "john_doe",
    targetType: "USER",
    targetId: "user-3",
    reason: "Suspicious behavior",
    description: "This user has been sending spam messages and asking for payment outside the platform.",
    status: "REVIEWED",
    createdAt: "2024-11-10T14:30:00Z",
  },
]

// Helper function to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Import centralized users service for signup synchronization
import { mockRegisteredUsersService } from "@/services/mockRegisteredUsersService"

// Mock Auth API
export const mockAuthAPI = {
signup: async (data: { username: string; email: string; password: string }) => {
await delay(500)
// Use centralized service to create user - this ensures synchronization with Admin Users
const result = await mockRegisteredUsersService.createUser(data)
return { data: { message: result.data.message } }
},

  login: async (data: { email: string; password: string }) => {
    await delay(500)
    
    // Use centralized users service for credential validation
    const validationResult = await mockRegisteredUsersService.validateCredentials(
      data.email,
      data.password
    )

    // Check validation result
    if (!validationResult.success) {
      // Throw specific error based on error code
      const error = new Error(validationResult.message) as Error & { code?: string }
      error.code = validationResult.errorCode
      throw error
    }

    // Validation successful - return user data with token
    const user = validationResult.user!
    return {
      data: {
        token: user.role === "ADMIN" ? "mock-admin-jwt-token" : "mock-jwt-token",
        username: user.username,
        email: user.email,
        role: user.role,
        id: user.id,
      },
    }
  },

  validate: async () => {
    await delay(200)
    return { data: { valid: true } }
  },

  googleCallback: async (code: string, redirectUri: string) => {
    await delay(500)
    return {
      data: {
        token: "mock-google-jwt-token",
        username: "google_user",
        email: "googleuser@gmail.com",
        role: "USER",
        id: "user-google",
      },
    }
  },
}

// Mock Admin API
export const mockAdminAPI = {
  dashboard: async () => {
    await delay(300)
    // Use centralized dashboard stats service
    const { mockDashboardStatsService } = await import("@/services/mockDashboardStatsService")
    const stats = await mockDashboardStatsService.getAllStats()
    return {
      data: {
        totalUsers: stats.data.totalUsers,
        totalTransactions: stats.data.totalTransactions,
        pendingDisputes: stats.data.disputes.pending,
        pendingCnicVerifications: stats.data.pendingVerifications,
        highRiskUsers: stats.data.fraudAlerts,
        activeListings: stats.data.activeListings,
        revenue: 15678900,
        recentActivity: [
          { type: "NEW_USER", message: "New user registered", time: new Date().toISOString() },
        ],
      },
    }
  },

  stats: async () => {
    await delay(300)
    const { mockDashboardStatsService } = await import("@/services/mockDashboardStatsService")
    const stats = await mockDashboardStatsService.getAllStats()
    return { data: stats.data }
  },

  getAllUsers: async (params?: { page?: number; size?: number }) => {
    await delay(300)
    const { mockRegisteredUsersService } = await import("@/services/mockRegisteredUsersService")
    return mockRegisteredUsersService.getAllUsers(params)
  },

  getUserById: async (id: string) => {
    await delay(200)
    const { mockRegisteredUsersService } = await import("@/services/mockRegisteredUsersService")
    return mockRegisteredUsersService.getUserById(id)
  },

  suspendUser: async (userId: string) => {
    await delay(300)
    const { mockTrustFraudService } = await import("@/services/mockTrustFraudService")
    const { mockRegisteredUsersService } = await import("@/services/mockRegisteredUsersService")
    await mockTrustFraudService.suspendUser(userId)
    await mockRegisteredUsersService.updateUserStatus(userId, "SUSPENDED")
    return { data: { message: `User ${userId} suspended successfully` } }
  },

  activateUser: async (userId: string) => {
    await delay(300)
    const { mockTrustFraudService } = await import("@/services/mockTrustFraudService")
    const { mockRegisteredUsersService } = await import("@/services/mockRegisteredUsersService")
    await mockTrustFraudService.unsuspendUser(userId)
    await mockRegisteredUsersService.updateUserStatus(userId, "ACTIVE")
    return { data: { message: `User ${userId} activated successfully` } }
  },

  getHighRiskUsers: async () => {
    await delay(300)
    const { mockTrustFraudService } = await import("@/services/mockTrustFraudService")
    return mockTrustFraudService.getHighRiskUsers()
  },

  getAllDisputes: async () => {
    await delay(300)
    const { mockDisputeService } = await import("@/services/mockDisputeService")
    return mockDisputeService.getAllDisputes()
  },

  getPendingCnic: async () => {
    await delay(300)
    const { mockVerificationService } = await import("@/services/mockVerificationService")
    return mockVerificationService.getPendingVerifications()
  },

  getAllCnic: async () => {
    await delay(300)
    const { mockVerificationService } = await import("@/services/mockVerificationService")
    return mockVerificationService.getAllVerifications()
  },

  approveCnic: async (id: string, remarks?: string) => {
    await delay(400)
    const { mockVerificationService } = await import("@/services/mockVerificationService")
    await mockVerificationService.approveVerification(id, remarks)
    return { data: { message: "Verification approved successfully" } }
  },

  rejectCnic: async (id: string, reason: string, remarks?: string) => {
    await delay(400)
    const { mockVerificationService } = await import("@/services/mockVerificationService")
    await mockVerificationService.rejectVerification(id, reason, remarks)
    return { data: { message: "Verification rejected" } }
  },
}

// Mock User API
export const mockUserAPI = {
  getAll: async (params?: { page?: number; size?: number }) => {
    await delay(300)
    const { mockRegisteredUsersService } = await import("@/services/mockRegisteredUsersService")
    return mockRegisteredUsersService.getAllUsers(params)
  },

  getById: async (id: string) => {
    await delay(200)
    const { mockRegisteredUsersService } = await import("@/services/mockRegisteredUsersService")
    try {
      return await mockRegisteredUsersService.getUserById(id)
    } catch {
      const user = mockUsers.find((u) => u.id === id)
      return { data: user || mockUsers[0] }
    }
  },

  getProfile: async () => {
    await delay(200)
    const userStr = localStorage.getItem("user")
    if (!userStr) throw new Error("Not authenticated")
    return { data: JSON.parse(userStr) }
  },

  updateProfile: async (data: { username?: string; profileImage?: string }) => {
    await delay(300)
    const userStr = localStorage.getItem("user")
    if (!userStr) throw new Error("Not authenticated")
    const user = JSON.parse(userStr)
    const updatedUser = { ...user, ...data }
    localStorage.setItem("user", JSON.stringify(updatedUser))
    return { data: updatedUser }
  },

  update: async (id: string, data: Partial<User>) => {
    await delay(300)
    return { data: { ...mockUsers[0], ...data } }
  },
}

// Mock Listing API
export const mockListingAPI = {
  create: async (formData: FormData) => {
    await delay(500)
    const newListing: Listing = {
      id: `listing-${Date.now()}`,
      title: (formData.get("title") as string) || "New Listing",
      description: (formData.get("description") as string) || "Description",
      price: Number(formData.get("price")) || 10000,
      category: (formData.get("category") as string) || "Electronics",
      condition: (formData.get("condition") as Listing["condition"]) || "NEW",
      images: ["/product-item.jpg"],
      imageUrls: ["/product-item.jpg"],
      type: (formData.get("type") as Listing["type"]) || "SALE",
      sellerId: "user-1",
      sellerName: "john_doe",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return { data: newListing }
  },

  getAll: async (params?: {
    page?: number
    size?: number
    sortBy?: string
    sortDir?: string
    category?: string
    search?: string
  }) => {
    await delay(300)
    let filtered = [...mockListings]

    if (params?.category && params.category !== "all") {
      filtered = filtered.filter((l) => l.category.toLowerCase() === params.category?.toLowerCase())
    }

    if (params?.search) {
      const search = params.search.toLowerCase()
      filtered = filtered.filter(
        (l) => l.title.toLowerCase().includes(search) || l.description.toLowerCase().includes(search),
      )
    }

    const page = params?.page || 0
    const size = params?.size || 10
    const start = page * size
    const end = start + size

    return {
      data: {
        content: filtered.slice(start, end),
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
        number: page,
        size: size,
      },
    }
  },

  getById: async (id: string) => {
    await delay(200)
    const listing = mockListings.find((l) => l.id === id)
    return { data: listing || mockListings[0] }
  },

  delete: async (id: string) => {
    await delay(300)
    return { data: { message: "Listing deleted successfully" } }
  },

  toggleFavorite: async (listingId: string) => {
    await delay(200)
    return { data: { isFavorite: true } }
  },

  getMine: async (params?: { page?: number; size?: number; sortBy?: string; sortDir?: string }) => {
    await delay(300)
    // Return user's own listings - for mock, return first 3 listings
    const userListings = mockListings.slice(0, 3)
    const page = params?.page || 0
    const size = params?.size || 10
    return {
      data: userListings.slice(page * size, (page + 1) * size),
    }
  },

  getFavorites: async () => {
    await delay(300)
    // Return favorited listings - for mock, return last 2 listings
    return { data: mockListings.slice(-2) }
  },

  getRent: async (params?: { page?: number; size?: number; sortBy?: string; sortDir?: string }) => {
    await delay(300)
    const rentListings = mockListings.filter((l) => l.type === "RENT")
    return { data: rentListings }
  },

  getSale: async (params?: { page?: number; size?: number; sortBy?: string; sortDir?: string }) => {
    await delay(300)
    const saleListings = mockListings.filter((l) => l.type === "SALE")
    return { data: saleListings }
  },

  getAllWithIds: async (params?: { page?: number; size?: number; sortBy?: string; sortDir?: string }) => {
    await delay(300)
    // Return all listings with IDs
    return { data: mockListings }
  },
}

// Mock Transaction API
import mockTransactionService from "@/services/mockTransactionService"

export const mockTransactionAPI = {
  // USER TRANSACTION ENDPOINTS
  // REAL API (to be enabled later): Uses axios with /api/transactions/*
  // MOCK IMPLEMENTATION (temporary): Uses mockTransactionService with localStorage
  create: mockTransactionService.create,
  getById: mockTransactionService.getById,
  getAll: mockTransactionService.getAll,
  acceptConditions: mockTransactionService.acceptConditions,
  requestRelease: mockTransactionService.requestRelease,
  confirmRelease: mockTransactionService.confirmRelease,
  refund: mockTransactionService.refund,
  dispute: mockTransactionService.dispute,
  startRental: mockTransactionService.startRental,
  completeRental: mockTransactionService.completeRental,
  deductDamage: mockTransactionService.deductDamage,
  finalizeRefund: mockTransactionService.finalizeRefund,

  // ADMIN TRANSACTION ENDPOINTS
  // REAL API (to be enabled later): Uses axios with /api/admin/transactions/*
  // MOCK IMPLEMENTATION (temporary): Uses mockTransactionService with localStorage
  adminResolveDispute: mockTransactionService.adminResolveDispute,
  getAdminStats: mockTransactionService.getAdminStats,
  getAdminTransactions: mockTransactionService.getAdminTransactions,
}

// Mock Chat API
export const mockChatAPI = {
  create: async (participants: string[]) => {
    await delay(300)
    return {
      data: {
        chatId: `chat-${Date.now()}`,
        participants,
      },
    }
  },

  sendMessage: async (chatId: string, data: { senderId: string; content: string }) => {
    await delay(200)
    return {
      data: {
        id: `msg-${Date.now()}`,
        chatId,
        senderId: data.senderId,
        content: data.content,
        createdAt: new Date().toISOString(),
        read: false,
      },
    }
  },

  getMessages: async (chatId: string, params?: { page?: number; size?: number }) => {
    await delay(200)
    const filtered = mockMessages.filter((m) => m.chatId === chatId)
    return {
      data: {
        content: filtered,
        totalElements: filtered.length,
        totalPages: 1,
      },
    }
  },

  getUserChats: async (userId: string, params?: { page?: number; size?: number }) => {
    await delay(200)
    return {
      data: {
        content: mockChatSummaries,
        totalElements: mockChatSummaries.length,
        totalPages: 1,
      },
    }
  },

  markAsRead: async (chatId: string, userId: string) => {
    await delay(100)
    return { data: { success: true } }
  },

  getSummaries: async (userId: string, params?: { page?: number; size?: number }) => {
    await delay(200)
    return {
      data: {
        content: mockChatSummaries,
        totalElements: mockChatSummaries.length,
        totalPages: 1,
      },
    }
  },
}

// Mock generic API for admin endpoints
export const mockApi = {
  get: async (url: string, config?: { params?: Record<string, unknown> }) => {
    await delay(300)

    if (url.includes("/admin/dashboard")) {
      return mockAdminAPI.dashboard()
    }

    if (url.includes("/admin/transactions/stats")) {
      return {
        data: {
          totalTransactions: 1247,
          completedTransactions: 1089,
          pendingTransactions: 98,
          disputedTransactions: 60,
          totalVolume: 15678900,
        },
      }
    }

    if (url.includes("/admin/transactions")) {
      return {
        data: {
          content: mockTransactions,
          totalElements: mockTransactions.length,
          totalPages: 1,
        },
      }
    }

    if (url.includes("/admin/listings")) {
      return {
        data: {
          content: mockListings,
          totalElements: mockListings.length,
          totalPages: 1,
        },
      }
    }

    if (url.includes("/admin/reports")) {
      return {
        data: {
          content: mockReports,
          totalElements: mockReports.length,
          totalPages: 1,
        },
      }
    }

    if (url.includes("/admin/disputes")) {
      return {
        data: {
          content: mockTransactions.filter((t) => t.status === "DISPUTED"),
          totalElements: 1,
          totalPages: 1,
        },
      }
    }

    return { data: {} }
  },

  post: async (url: string, data?: unknown) => {
    await delay(300)
    return { data: { success: true, message: "Operation successful" } }
  },

  put: async (url: string, data?: unknown) => {
    await delay(300)
    return { data: { success: true, message: "Update successful" } }
  },

  delete: async (url: string) => {
    await delay(300)
    return { data: { success: true, message: "Delete successful" } }
  },
}

export default mockApi
