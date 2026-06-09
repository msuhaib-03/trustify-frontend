// =====================================================
// ADMIN CHAT MONITORING API
// =====================================================
// This file contains mock APIs for admin chat monitoring.
// When backend is ready, uncomment REAL API sections and
// remove/comment the MOCK API sections.
// =====================================================

// Delay helper for simulating network latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface ChatUser {
  id: string
  username: string
  email: string
  role: "BUYER" | "SELLER" | "RENTER"
  profileImage: string
  totalChats: number
  lastActive: string
  isOnline: boolean
}

export interface ChatPartner {
  id: string
  username: string
  role: "BUYER" | "SELLER" | "RENTER"
  profileImage: string
  lastMessage: string
  lastMessageTime: string
  chatId: string
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  receiverId: string
  receiverName: string
  content: string
  timestamp: string
}

export interface ChatConversation {
  chatId: string
  participants: {
    user1: { id: string; username: string; role: string; profileImage: string }
    user2: { id: string; username: string; role: string; profileImage: string }
  }
  messages: ChatMessage[]
  createdAt: string
  lastMessageAt: string
}

// =====================================================
// MOCK DATA
// =====================================================

const mockChatUsers: ChatUser[] = [
  {
    id: "user-1",
    username: "john_doe",
    email: "john@example.com",
    role: "BUYER",
    profileImage: "/male-avatar-professional.jpg",
    totalChats: 5,
    lastActive: "2024-11-14T15:30:00Z",
    isOnline: true,
  },
  {
    id: "user-2",
    username: "jane_smith",
    email: "jane@example.com",
    role: "SELLER",
    profileImage: "/female-avatar-professional.jpg",
    totalChats: 8,
    lastActive: "2024-11-14T14:45:00Z",
    isOnline: true,
  },
  {
    id: "user-3",
    username: "mike_wilson",
    email: "mike@example.com",
    role: "RENTER",
    profileImage: "/male-avatar-casual.jpg",
    totalChats: 3,
    lastActive: "2024-11-14T12:00:00Z",
    isOnline: false,
  },
  {
    id: "user-4",
    username: "sarah_jones",
    email: "sarah@example.com",
    role: "SELLER",
    profileImage: "/female-avatar-business.jpg",
    totalChats: 12,
    lastActive: "2024-11-14T16:00:00Z",
    isOnline: true,
  },
  {
    id: "user-5",
    username: "david_brown",
    email: "david@example.com",
    role: "BUYER",
    profileImage: "/young-male-avatar.png",
    totalChats: 2,
    lastActive: "2024-11-13T18:00:00Z",
    isOnline: false,
  },
  {
    id: "user-6",
    username: "emma_davis",
    email: "emma@example.com",
    role: "RENTER",
    profileImage: "/female-avatar-friendly.jpg",
    totalChats: 6,
    lastActive: "2024-11-14T13:30:00Z",
    isOnline: false,
  },
]

const mockChatPartners: Record<string, ChatPartner[]> = {
  "user-1": [
    {
      id: "user-2",
      username: "jane_smith",
      role: "SELLER",
      profileImage: "/female-avatar-professional.jpg",
      lastMessage: "Battery health is at 94%. I'll send the photos shortly.",
      lastMessageTime: "2024-11-14T15:00:00Z",
      chatId: "chat-1",
    },
    {
      id: "user-4",
      username: "sarah_jones",
      role: "SELLER",
      profileImage: "/female-avatar-business.jpg",
      lastMessage: "Yes, the camera is in perfect condition!",
      lastMessageTime: "2024-11-14T10:30:00Z",
      chatId: "chat-2",
    },
    {
      id: "user-6",
      username: "emma_davis",
      role: "RENTER",
      profileImage: "/female-avatar-friendly.jpg",
      lastMessage: "I can deliver it tomorrow if that works for you.",
      lastMessageTime: "2024-11-13T16:00:00Z",
      chatId: "chat-3",
    },
  ],
  "user-2": [
    {
      id: "user-1",
      username: "john_doe",
      role: "BUYER",
      profileImage: "/male-avatar-professional.jpg",
      lastMessage: "That would be great! Can you also tell me about the battery health?",
      lastMessageTime: "2024-11-14T14:30:00Z",
      chatId: "chat-1",
    },
    {
      id: "user-3",
      username: "mike_wilson",
      role: "RENTER",
      profileImage: "/male-avatar-casual.jpg",
      lastMessage: "I'm interested in renting for a week.",
      lastMessageTime: "2024-11-14T11:00:00Z",
      chatId: "chat-4",
    },
    {
      id: "user-5",
      username: "david_brown",
      role: "BUYER",
      profileImage: "/young-male-avatar.png",
      lastMessage: "What's your best price?",
      lastMessageTime: "2024-11-13T14:00:00Z",
      chatId: "chat-5",
    },
  ],
  "user-3": [
    {
      id: "user-2",
      username: "jane_smith",
      role: "SELLER",
      profileImage: "/female-avatar-professional.jpg",
      lastMessage: "Sure, weekly rental is available at $50/week.",
      lastMessageTime: "2024-11-14T11:15:00Z",
      chatId: "chat-4",
    },
    {
      id: "user-4",
      username: "sarah_jones",
      role: "SELLER",
      profileImage: "/female-avatar-business.jpg",
      lastMessage: "The deposit is refundable upon return.",
      lastMessageTime: "2024-11-14T09:00:00Z",
      chatId: "chat-6",
    },
  ],
  "user-4": [
    {
      id: "user-1",
      username: "john_doe",
      role: "BUYER",
      profileImage: "/male-avatar-professional.jpg",
      lastMessage: "Great, I'll take it!",
      lastMessageTime: "2024-11-14T10:45:00Z",
      chatId: "chat-2",
    },
    {
      id: "user-3",
      username: "mike_wilson",
      role: "RENTER",
      profileImage: "/male-avatar-casual.jpg",
      lastMessage: "When can I pick it up?",
      lastMessageTime: "2024-11-14T09:15:00Z",
      chatId: "chat-6",
    },
    {
      id: "user-6",
      username: "emma_davis",
      role: "RENTER",
      profileImage: "/female-avatar-friendly.jpg",
      lastMessage: "Thanks for the quick response!",
      lastMessageTime: "2024-11-13T17:00:00Z",
      chatId: "chat-7",
    },
  ],
  "user-5": [
    {
      id: "user-2",
      username: "jane_smith",
      role: "SELLER",
      profileImage: "/female-avatar-professional.jpg",
      lastMessage: "I can do $950, final offer.",
      lastMessageTime: "2024-11-13T14:30:00Z",
      chatId: "chat-5",
    },
  ],
  "user-6": [
    {
      id: "user-1",
      username: "john_doe",
      role: "BUYER",
      profileImage: "/male-avatar-professional.jpg",
      lastMessage: "Tomorrow works perfectly!",
      lastMessageTime: "2024-11-13T16:15:00Z",
      chatId: "chat-3",
    },
    {
      id: "user-4",
      username: "sarah_jones",
      role: "SELLER",
      profileImage: "/female-avatar-business.jpg",
      lastMessage: "I'll bring the accessories too.",
      lastMessageTime: "2024-11-13T17:15:00Z",
      chatId: "chat-7",
    },
  ],
}

const mockConversations: Record<string, ChatConversation> = {
  "chat-1": {
    chatId: "chat-1",
    participants: {
      user1: { id: "user-1", username: "john_doe", role: "BUYER", profileImage: "/male-avatar-professional.jpg" },
      user2: { id: "user-2", username: "jane_smith", role: "SELLER", profileImage: "/female-avatar-professional.jpg" },
    },
    messages: [
      {
        id: "m1",
        senderId: "user-1",
        senderName: "john_doe",
        receiverId: "user-2",
        receiverName: "jane_smith",
        content: "Hi! I'm interested in the MacBook Pro. Is it still available?",
        timestamp: "2024-11-14T14:00:00Z",
      },
      {
        id: "m2",
        senderId: "user-2",
        senderName: "jane_smith",
        receiverId: "user-1",
        receiverName: "john_doe",
        content: "Yes, it's still available! Would you like to see more photos?",
        timestamp: "2024-11-14T14:15:00Z",
      },
      {
        id: "m3",
        senderId: "user-1",
        senderName: "john_doe",
        receiverId: "user-2",
        receiverName: "jane_smith",
        content: "That would be great! Can you also tell me about the battery health?",
        timestamp: "2024-11-14T14:30:00Z",
      },
      {
        id: "m4",
        senderId: "user-2",
        senderName: "jane_smith",
        receiverId: "user-1",
        receiverName: "john_doe",
        content: "Battery health is at 94%. I'll send the photos shortly.",
        timestamp: "2024-11-14T15:00:00Z",
      },
      {
        id: "m5",
        senderId: "user-1",
        senderName: "john_doe",
        receiverId: "user-2",
        receiverName: "jane_smith",
        content: "That sounds perfect! What's your asking price?",
        timestamp: "2024-11-14T15:15:00Z",
      },
      {
        id: "m6",
        senderId: "user-2",
        senderName: "jane_smith",
        receiverId: "user-1",
        receiverName: "john_doe",
        content: "I'm asking $1,199, but I'm open to reasonable offers.",
        timestamp: "2024-11-14T15:20:00Z",
      },
    ],
    createdAt: "2024-11-14T14:00:00Z",
    lastMessageAt: "2024-11-14T15:20:00Z",
  },
  "chat-2": {
    chatId: "chat-2",
    participants: {
      user1: { id: "user-1", username: "john_doe", role: "BUYER", profileImage: "/male-avatar-professional.jpg" },
      user2: { id: "user-4", username: "sarah_jones", role: "SELLER", profileImage: "/female-avatar-business.jpg" },
    },
    messages: [
      {
        id: "m7",
        senderId: "user-1",
        senderName: "john_doe",
        receiverId: "user-4",
        receiverName: "sarah_jones",
        content: "Hello! Is the Canon camera still for sale?",
        timestamp: "2024-11-14T10:00:00Z",
      },
      {
        id: "m8",
        senderId: "user-4",
        senderName: "sarah_jones",
        receiverId: "user-1",
        receiverName: "john_doe",
        content: "Hi! Yes, it's available. Are you interested?",
        timestamp: "2024-11-14T10:15:00Z",
      },
      {
        id: "m9",
        senderId: "user-1",
        senderName: "john_doe",
        receiverId: "user-4",
        receiverName: "sarah_jones",
        content: "Yes! What condition is the sensor in?",
        timestamp: "2024-11-14T10:20:00Z",
      },
      {
        id: "m10",
        senderId: "user-4",
        senderName: "sarah_jones",
        receiverId: "user-1",
        receiverName: "john_doe",
        content: "Yes, the camera is in perfect condition!",
        timestamp: "2024-11-14T10:30:00Z",
      },
      {
        id: "m11",
        senderId: "user-1",
        senderName: "john_doe",
        receiverId: "user-4",
        receiverName: "sarah_jones",
        content: "Great, I'll take it!",
        timestamp: "2024-11-14T10:45:00Z",
      },
    ],
    createdAt: "2024-11-14T10:00:00Z",
    lastMessageAt: "2024-11-14T10:45:00Z",
  },
  "chat-3": {
    chatId: "chat-3",
    participants: {
      user1: { id: "user-1", username: "john_doe", role: "BUYER", profileImage: "/male-avatar-professional.jpg" },
      user2: { id: "user-6", username: "emma_davis", role: "RENTER", profileImage: "/female-avatar-friendly.jpg" },
    },
    messages: [
      {
        id: "m12",
        senderId: "user-1",
        senderName: "john_doe",
        receiverId: "user-6",
        receiverName: "emma_davis",
        content: "Hi Emma! I saw your listing for the projector rental.",
        timestamp: "2024-11-13T15:00:00Z",
      },
      {
        id: "m13",
        senderId: "user-6",
        senderName: "emma_davis",
        receiverId: "user-1",
        receiverName: "john_doe",
        content: "Hey John! Yes, it's available for this weekend.",
        timestamp: "2024-11-13T15:30:00Z",
      },
      {
        id: "m14",
        senderId: "user-1",
        senderName: "john_doe",
        receiverId: "user-6",
        receiverName: "emma_davis",
        content: "Perfect! Can you deliver it?",
        timestamp: "2024-11-13T15:45:00Z",
      },
      {
        id: "m15",
        senderId: "user-6",
        senderName: "emma_davis",
        receiverId: "user-1",
        receiverName: "john_doe",
        content: "I can deliver it tomorrow if that works for you.",
        timestamp: "2024-11-13T16:00:00Z",
      },
      {
        id: "m16",
        senderId: "user-1",
        senderName: "john_doe",
        receiverId: "user-6",
        receiverName: "emma_davis",
        content: "Tomorrow works perfectly!",
        timestamp: "2024-11-13T16:15:00Z",
      },
    ],
    createdAt: "2024-11-13T15:00:00Z",
    lastMessageAt: "2024-11-13T16:15:00Z",
  },
  "chat-4": {
    chatId: "chat-4",
    participants: {
      user1: { id: "user-2", username: "jane_smith", role: "SELLER", profileImage: "/female-avatar-professional.jpg" },
      user2: { id: "user-3", username: "mike_wilson", role: "RENTER", profileImage: "/male-avatar-casual.jpg" },
    },
    messages: [
      {
        id: "m17",
        senderId: "user-3",
        senderName: "mike_wilson",
        receiverId: "user-2",
        receiverName: "jane_smith",
        content: "Hi! Do you offer rentals on the MacBook?",
        timestamp: "2024-11-14T10:30:00Z",
      },
      {
        id: "m18",
        senderId: "user-2",
        senderName: "jane_smith",
        receiverId: "user-3",
        receiverName: "mike_wilson",
        content: "Hello! Yes, I do offer weekly rentals.",
        timestamp: "2024-11-14T10:45:00Z",
      },
      {
        id: "m19",
        senderId: "user-3",
        senderName: "mike_wilson",
        receiverId: "user-2",
        receiverName: "jane_smith",
        content: "I'm interested in renting for a week.",
        timestamp: "2024-11-14T11:00:00Z",
      },
      {
        id: "m20",
        senderId: "user-2",
        senderName: "jane_smith",
        receiverId: "user-3",
        receiverName: "mike_wilson",
        content: "Sure, weekly rental is available at $50/week.",
        timestamp: "2024-11-14T11:15:00Z",
      },
    ],
    createdAt: "2024-11-14T10:30:00Z",
    lastMessageAt: "2024-11-14T11:15:00Z",
  },
  "chat-5": {
    chatId: "chat-5",
    participants: {
      user1: { id: "user-2", username: "jane_smith", role: "SELLER", profileImage: "/female-avatar-professional.jpg" },
      user2: { id: "user-5", username: "david_brown", role: "BUYER", profileImage: "/young-male-avatar.png" },
    },
    messages: [
      {
        id: "m21",
        senderId: "user-5",
        senderName: "david_brown",
        receiverId: "user-2",
        receiverName: "jane_smith",
        content: "Hello! I'm interested in your iPhone listing.",
        timestamp: "2024-11-13T13:00:00Z",
      },
      {
        id: "m22",
        senderId: "user-2",
        senderName: "jane_smith",
        receiverId: "user-5",
        receiverName: "david_brown",
        content: "Hi David! It's still available.",
        timestamp: "2024-11-13T13:30:00Z",
      },
      {
        id: "m23",
        senderId: "user-5",
        senderName: "david_brown",
        receiverId: "user-2",
        receiverName: "jane_smith",
        content: "What's your best price?",
        timestamp: "2024-11-13T14:00:00Z",
      },
      {
        id: "m24",
        senderId: "user-2",
        senderName: "jane_smith",
        receiverId: "user-5",
        receiverName: "david_brown",
        content: "I can do $950, final offer.",
        timestamp: "2024-11-13T14:30:00Z",
      },
    ],
    createdAt: "2024-11-13T13:00:00Z",
    lastMessageAt: "2024-11-13T14:30:00Z",
  },
  "chat-6": {
    chatId: "chat-6",
    participants: {
      user1: { id: "user-3", username: "mike_wilson", role: "RENTER", profileImage: "/male-avatar-casual.jpg" },
      user2: { id: "user-4", username: "sarah_jones", role: "SELLER", profileImage: "/female-avatar-business.jpg" },
    },
    messages: [
      {
        id: "m25",
        senderId: "user-3",
        senderName: "mike_wilson",
        receiverId: "user-4",
        receiverName: "sarah_jones",
        content: "Hi Sarah! Can I rent the camera equipment?",
        timestamp: "2024-11-14T08:30:00Z",
      },
      {
        id: "m26",
        senderId: "user-4",
        senderName: "sarah_jones",
        receiverId: "user-3",
        receiverName: "mike_wilson",
        content: "Yes! The full kit is available for rent.",
        timestamp: "2024-11-14T08:45:00Z",
      },
      {
        id: "m27",
        senderId: "user-3",
        senderName: "mike_wilson",
        receiverId: "user-4",
        receiverName: "sarah_jones",
        content: "Is there a deposit required?",
        timestamp: "2024-11-14T08:50:00Z",
      },
      {
        id: "m28",
        senderId: "user-4",
        senderName: "sarah_jones",
        receiverId: "user-3",
        receiverName: "mike_wilson",
        content: "The deposit is refundable upon return.",
        timestamp: "2024-11-14T09:00:00Z",
      },
      {
        id: "m29",
        senderId: "user-3",
        senderName: "mike_wilson",
        receiverId: "user-4",
        receiverName: "sarah_jones",
        content: "When can I pick it up?",
        timestamp: "2024-11-14T09:15:00Z",
      },
    ],
    createdAt: "2024-11-14T08:30:00Z",
    lastMessageAt: "2024-11-14T09:15:00Z",
  },
  "chat-7": {
    chatId: "chat-7",
    participants: {
      user1: { id: "user-4", username: "sarah_jones", role: "SELLER", profileImage: "/female-avatar-business.jpg" },
      user2: { id: "user-6", username: "emma_davis", role: "RENTER", profileImage: "/female-avatar-friendly.jpg" },
    },
    messages: [
      {
        id: "m30",
        senderId: "user-6",
        senderName: "emma_davis",
        receiverId: "user-4",
        receiverName: "sarah_jones",
        content: "Hey Sarah! Do you have any tripods available?",
        timestamp: "2024-11-13T16:00:00Z",
      },
      {
        id: "m31",
        senderId: "user-4",
        senderName: "sarah_jones",
        receiverId: "user-6",
        receiverName: "emma_davis",
        content: "Yes! I have a professional tripod for sale.",
        timestamp: "2024-11-13T16:30:00Z",
      },
      {
        id: "m32",
        senderId: "user-6",
        senderName: "emma_davis",
        receiverId: "user-4",
        receiverName: "sarah_jones",
        content: "Does it come with accessories?",
        timestamp: "2024-11-13T16:45:00Z",
      },
      {
        id: "m33",
        senderId: "user-4",
        senderName: "sarah_jones",
        receiverId: "user-6",
        receiverName: "emma_davis",
        content: "I'll bring the accessories too.",
        timestamp: "2024-11-13T17:15:00Z",
      },
      {
        id: "m34",
        senderId: "user-6",
        senderName: "emma_davis",
        receiverId: "user-4",
        receiverName: "sarah_jones",
        content: "Thanks for the quick response!",
        timestamp: "2024-11-13T17:00:00Z",
      },
    ],
    createdAt: "2024-11-13T16:00:00Z",
    lastMessageAt: "2024-11-13T17:15:00Z",
  },
}

// =====================================================
// ADMIN CHAT MONITORING API
// =====================================================

export const adminChatAPI = {
  /**
   * Get all users who have chat activity
   * LEVEL 1 - Chat Overview (Global View)
   */
  getAllChatsForAdmin: async (): Promise<{ data: ChatUser[] }> => {
    // ===== REAL API (COMMENTED) =====
    /*
    return api.get("/admin/chats/users");
    */

    // ===== MOCK API (ACTIVE) =====
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: mockChatUsers })
      }, 500)
    })
  },

  /**
   * Get all chat partners for a specific user
   * LEVEL 2 - User-to-User Chat Details (Partner List)
   */
  getUserChatPartners: async (userId: string): Promise<{ data: ChatPartner[] }> => {
    // ===== REAL API (COMMENTED) =====
    /*
    return api.get(`/admin/chats/users/${userId}/partners`);
    */

    // ===== MOCK API (ACTIVE) =====
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: mockChatPartners[userId] || [] })
      }, 400)
    })
  },

  /**
   * Get full chat history between two users
   * LEVEL 2 - User-to-User Chat Details (Full Conversation)
   */
  getChatHistory: async (chatId: string): Promise<{ data: ChatConversation | null }> => {
    // ===== REAL API (COMMENTED) =====
    /*
    return api.get(`/admin/chats/${chatId}`);
    */

    // ===== MOCK API (ACTIVE) =====
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: mockConversations[chatId] || null })
      }, 300)
    })
  },

  /**
   * Search users by name or email
   */
  searchUsers: async (query: string): Promise<{ data: ChatUser[] }> => {
    // ===== REAL API (COMMENTED) =====
    /*
    return api.get(`/admin/chats/users/search?q=${query}`);
    */

    // ===== MOCK API (ACTIVE) =====
    return new Promise((resolve) => {
      setTimeout(() => {
        const filtered = mockChatUsers.filter(
          (user) =>
            user.username.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase()),
        )
        resolve({ data: filtered })
      }, 300)
    })
  },

  /**
   * Get chat statistics for admin dashboard
   */
  getChatStats: async (): Promise<{
    data: {
      totalChats: number
      activeUsers: number
      messagesLast24h: number
      averageResponseTime: string
    }
  }> => {
    // ===== REAL API (COMMENTED) =====
    /*
    return api.get("/admin/chats/stats");
    */

    // ===== MOCK API (ACTIVE) =====
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            totalChats: Object.keys(mockConversations).length,
            activeUsers: mockChatUsers.filter((u) => u.isOnline).length,
            messagesLast24h: 156,
            averageResponseTime: "12 min",
          },
        })
      }, 200)
    })
  },
}
