/**
 * =====================================================
 * REAL CHAT API
 * =====================================================
 * Provides all chat-related API functions using real backend endpoints.
 * 
 * Backend Endpoints (Spring Boot):
 * - POST /api/chats - Create chat
 * - GET /api/chats?userId=X - Get chats for user
 * - GET /api/chats/{chatId}/messages - Get chat history
 * - POST /api/chats/{chatId}/messages - Save message
 * - POST /api/chats/{chatId}/read?userId=X - Mark messages as read
 * - GET /api/chats/summaries?userId=X - Get chat summaries
 * =====================================================
 */

import axios from "axios"

// API Base URL - uses the same base as other APIs
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"

// Create axios instance with auth interceptor
const chatAxios = axios.create({
  baseURL: API_BASE_URL,
})

// Add auth token to all requests
chatAxios.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// =====================================================
// TYPE DEFINITIONS
// =====================================================
export interface ChatUser {
  id: string
  username: string
  email: string
  role?: "BUYER" | "SELLER" | "RENTER"
  profileImage?: string
  isOnline?: boolean
  lastActive?: string
}

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName?: string
  senderImage?: string
  receiverId?: string
  receiverName?: string
  content: string
  type: "text" | "voice"
  voiceUrl?: string
  voiceDuration?: number
  createdAt: string
  timestamp?: string // Backend uses 'timestamp' field
  read: boolean
  readBy?: string[]
}

export interface ChatConversation {
  chatId: string
  id?: string // Backend uses 'id' instead of 'chatId' sometimes
  participants: string[] | { user1: ChatUser; user2: ChatUser }
  lastMessage?: string
  lastMessageTime?: string
  lastTimestamp?: string // Backend field name
  unreadCount: number
  messages?: ChatMessage[]
  updatedAt?: string
}

export interface ChatListItem {
  chatId: string
  recipientId: string
  recipientName: string
  recipientImage: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
}

export interface ChatSummary {
  chatId: string
  lastMessage: string | null
  lastTimestamp: string
  unreadCount: number
}

// =====================================================
// NAME RESOLUTION HELPER
// =====================================================

/** Module-level cache — persists within the browser session */
const _nameCache = new Map<string, string>()

/**
 * Resolves a participant ID (email or MongoDB ObjectId) to a human-readable name.
 * - Email  → "saeed@gmail.com"  → "Saeed"
 * - Email  → "john.doe@x.com"  → "John Doe"
 * - ObjectId → fetches GET /users/{id} → username field → fallback to truncated ID
 */
async function resolveDisplayName(id: string): Promise<string> {
  if (!id) return "User"
  if (_nameCache.has(id)) return _nameCache.get(id)!

  if (id.includes("@")) {
    // Derive readable name from email prefix
    const name = id
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
    _nameCache.set(id, name)
    return name
  }

  // MongoDB ObjectId — fetch username from backend (requires auth, but user is always logged in)
  try {
    const res = await chatAxios.get(`/users/${id}`)
    const name =
      res.data?.username ||
      (res.data?.email ? res.data.email.split("@")[0] : null) ||
      `${id.slice(0, 8)}…`
    _nameCache.set(id, name)
    return name
  } catch {
    const fallback = `${id.slice(0, 8)}…`
    _nameCache.set(id, fallback)
    return fallback
  }
}

// =====================================================
// USER CHAT API FUNCTIONS
// =====================================================

/**
 * Create a new chat or get existing one
 * POST /api/chats
 */
export const createChat = async (participants: string[], chatId?: string) => {
  const response = await chatAxios.post("/chats", {
    chatId,
    participants,
  })
  return response
}

/**
 * Get all conversations for a user
 * GET /api/chats?userId=X
 */
export const getUserConversations = async (
  userId: string,
  params?: { page?: number; size?: number }
) => {
  const response = await chatAxios.get("/chats", {
    params: {
      userId,
      page: params?.page || 0,
      size: params?.size || 20,
    },
  })

  // Transform backend response to match frontend expectations
  const chats = response.data?.content || response.data || []
  
  // Transform each chat to ChatListItem format
  const transformed: ChatListItem[] = await Promise.all(
    chats.map(async (chat: ChatConversation) => {
      const chatIdValue = chat.id || chat.chatId
      const participants = Array.isArray(chat.participants) 
        ? chat.participants 
        : [chat.participants?.user1?.id, chat.participants?.user2?.id].filter(Boolean)
      
      // Find the other participant (not the current user)
      const otherParticipantId = participants.find((p: string) => p !== userId) || ""
      
      // Get last message from the chat
      const lastMsg = chat.messages?.[chat.messages.length - 1]
      
      return {
        chatId: chatIdValue,
        recipientId: otherParticipantId,
        recipientName: await resolveDisplayName(otherParticipantId),
        recipientImage: "",
        lastMessage: lastMsg?.content || chat.lastMessage || "",
        lastMessageTime: lastMsg?.timestamp || lastMsg?.createdAt || chat.updatedAt || new Date().toISOString(),
        unreadCount: chat.unreadCount || 0,
        isOnline: false, // Will be updated via WebSocket presence
      }
    })
  )

  return {
    data: {
      content: transformed,
      totalElements: response.data?.totalElements || transformed.length,
    },
  }
}

/**
 * Get chat summaries for a user (lightweight endpoint)
 * GET /api/chats/summaries?userId=X
 */
export const getChatSummaries = async (
  userId: string,
  params?: { page?: number; size?: number }
) => {
  const response = await chatAxios.get("/chats/summaries", {
    params: {
      userId,
      page: params?.page || 0,
      size: params?.size || 20,
    },
  })
  return response
}

/**
 * Get messages for a specific chat
 * GET /api/chats/{chatId}/messages
 */
export const getChatMessages = async (
  chatId: string,
  userId: string,
  params?: { page?: number; size?: number }
) => {
  const response = await chatAxios.get(`/chats/${chatId}/messages`, {
    params: {
      page: params?.page || 0,
      size: params?.size || 50,
    },
  })

  // Transform backend response
  const backendMessages = response.data?.messages || []
  const messages: ChatMessage[] = backendMessages.map((msg: any) => ({
    id: msg.id || `msg-${Date.now()}-${Math.random()}`,
    chatId: chatId,
    senderId: msg.senderId,
    senderName: msg.senderName || msg.senderId,
    content: msg.content,
    type: msg.type || "text",
    voiceUrl: msg.voiceUrl,
    voiceDuration: msg.voiceDuration,
    createdAt: msg.timestamp || msg.createdAt || new Date().toISOString(),
    read: msg.readBy?.includes(userId) || false,
    readBy: msg.readBy || [],
  }))

  // Resolve the other participant's name from the participantNames map
  const participants: string[] = response.data?.participants
    ? Array.from(response.data.participants as string[])
    : []
  const participantNames: Record<string, string> = response.data?.participantNames || {}
  const otherId = participants.find((p: string) => p !== userId) || ""
  const otherName = participantNames[otherId] || otherId.split("@")[0] || "User"

  const otherUser = {
    id: otherId,
    username: otherName,
    profileImage: "",
    isOnline: false,
  }

  return {
    data: {
      messages,
      otherUser,
      totalMessages: response.data?.totalMessages || messages.length,
    },
  }
}

/**
 * Send a text message (via REST - for backup/persistence)
 * POST /api/chats/{chatId}/messages
 * 
 * Note: In real-time chat, messages are sent via WebSocket.
 * This endpoint is used by the Node.js server to persist messages.
 */
export const sendTextMessage = async (
  chatId: string,
  senderId: string,
  content: string
): Promise<{ data: ChatMessage }> => {
  const response = await chatAxios.post(`/chats/${chatId}/messages`, {
    senderId,
    content,
    type: "text",
  })

  // Transform response to ChatMessage
  const savedChat = response.data
  const lastMessage = savedChat.messages?.[savedChat.messages.length - 1]

  const message: ChatMessage = {
    id: lastMessage?.id || `msg-${Date.now()}`,
    chatId,
    senderId,
    senderName: senderId,
    content,
    type: "text",
    createdAt: lastMessage?.timestamp || new Date().toISOString(),
    read: false,
  }

  return { data: message }
}

/**
 * Send a voice message
 * Note: Voice messages need to be uploaded to a file server first,
 * then the URL is sent as a message
 */
export const sendVoiceMessage = async (
  chatId: string,
  senderId: string,
  audioBlob: Blob,
  duration: number
): Promise<{ data: ChatMessage }> => {
  // For now, create a local blob URL
  // In production, upload to S3/cloud storage first
  const voiceUrl = URL.createObjectURL(audioBlob)

  const response = await chatAxios.post(`/chats/${chatId}/messages`, {
    senderId,
    content: "Voice message",
    type: "voice",
    voiceUrl,
    voiceDuration: duration,
  })

  const savedChat = response.data
  const lastMessage = savedChat.messages?.[savedChat.messages.length - 1]

  const message: ChatMessage = {
    id: lastMessage?.id || `msg-${Date.now()}`,
    chatId,
    senderId,
    senderName: senderId,
    content: "Voice message",
    type: "voice",
    voiceUrl,
    voiceDuration: duration,
    createdAt: lastMessage?.timestamp || new Date().toISOString(),
    read: false,
  }

  return { data: message }
}

/**
 * Mark messages as read
 * POST /api/chats/{chatId}/read?userId=X
 */
export const markMessagesAsRead = async (chatId: string, userId: string) => {
  const response = await chatAxios.post(`/chats/${chatId}/read`, null, {
    params: { userId },
  })
  return { data: { success: true, chat: response.data } }
}

// =====================================================
// ADMIN CHAT API FUNCTIONS
// =====================================================

/**
 * Get all chat users with their chat activity (for admin)
 * Uses GET /admin/chats — no userId required, ADMIN authority only.
 */
export const getAdminChatUsers = async () => {
  const response = await chatAxios.get("/admin/chats", {
    params: { page: 0, size: 100 },
  })

  const chats = response.data?.content || response.data || []

  // Aggregate unique participants across all chats
  const userMap = new Map<string, ChatUser & { totalChats: number }>()

  chats.forEach((chat: any) => {
    const participants: string[] = Array.isArray(chat.participants)
      ? chat.participants
      : Object.values(chat.participants || {}) as string[]

    participants.forEach((participantId: string) => {
      if (!participantId) return
      if (!userMap.has(participantId)) {
        // Use email prefix as a readable display name when we only have the raw id/email
        const displayName = participantId.includes("@")
          ? participantId.split("@")[0]
          : participantId
        userMap.set(participantId, {
          id: participantId,
          username: displayName,
          email: participantId.includes("@") ? participantId : "",
          isOnline: false,
          lastActive: chat.updatedAt || new Date().toISOString(),
          totalChats: 1,
        })
      } else {
        const existing = userMap.get(participantId)!
        existing.totalChats++
        // Keep the most-recent lastActive
        if (chat.updatedAt && existing.lastActive &&
            new Date(chat.updatedAt) > new Date(existing.lastActive)) {
          existing.lastActive = chat.updatedAt
        }
      }
    })
  })

  return { data: Array.from(userMap.values()) }
}

/**
 * Get chat partners for a specific user (for admin)
 */
export const getAdminUserPartners = async (userId: string) => {
  const response = await chatAxios.get("/chats", {
    params: { userId, page: 0, size: 50 },
  })

  const chats = response.data?.content || response.data || []
  
  const partners = chats.map((chat: ChatConversation) => {
    const chatId = chat.id || chat.chatId
    const participants = Array.isArray(chat.participants) 
      ? chat.participants 
      : [chat.participants?.user1?.id, chat.participants?.user2?.id].filter(Boolean)
    
    const partnerId = participants.find((p: string) => p !== userId) || ""
    const lastMsg = chat.messages?.[chat.messages.length - 1]

    return {
      id: partnerId,
      username: partnerId.includes("@")
        ? partnerId.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : partnerId.slice(0, 12) + "…",
      role: "BUYER",
      profileImage: "",
      lastMessage: lastMsg?.content || "",
      lastMessageTime: lastMsg?.timestamp || chat.updatedAt || new Date().toISOString(),
      chatId,
    }
  })

  return { data: partners }
}

/**
 * Get chat statistics (for admin)
 */
export const getAdminChatStats = async () => {
  const response = await chatAxios.get("/admin/chats", {
    params: { page: 0, size: 100 },
  })

  const chats = response.data?.content || response.data || []
  // The admin /admin/chats endpoint returns simplified summaries with messageCount
  const totalMessages = chats.reduce((acc: number, chat: any) =>
    acc + (chat.messageCount || chat.messages?.length || 0), 0)
  
  // Get unique users
  const userSet = new Set<string>()
  chats.forEach((chat: ChatConversation) => {
    const participants = Array.isArray(chat.participants) 
      ? chat.participants 
      : [chat.participants?.user1?.id, chat.participants?.user2?.id].filter(Boolean)
    participants.forEach((p: string) => userSet.add(p))
  })

  return {
    data: {
      totalChats: chats.length,
      activeUsers: userSet.size,
      messagesLast24h: totalMessages,
      averageResponseTime: "5 min",
    },
  }
}

/**
 * Get all chats (admin)
 */
export const getAdminChats = async (params?: { page?: number; size?: number }) => {
  const response = await chatAxios.get("/admin/chats", {
    params: {
      page: params?.page || 0,
      size: params?.size || 50,
    },
  })
  return response
}

/**
 * Get chat history for admin view
 * The backend GET /chats/{chatId}/messages response includes:
 *   participants: Set<String>   — participant IDs
 *   participantNames: Map<id,name>  — resolved display names
 */
export const getAdminChatHistory = async (chatId: string) => {
  const response = await chatAxios.get(`/chats/${chatId}/messages`, {
    params: { page: 0, size: 1000 },
  })

  const messages = response.data?.messages || response.data?.content || []
  const now = new Date().toISOString()

  // Resolve participant display names from the backend's participantNames map
  const participantIds: string[] = response.data?.participants
    ? Array.from(response.data.participants as string[])
    : []
  const participantNames: Record<string, string> = response.data?.participantNames || {}

  const user1Id = participantIds[0] || ""
  const user2Id = participantIds[1] || ""

  const resolveName = (id: string) =>
    participantNames[id] ||
    (id.includes("@") ? id.split("@")[0] : id) ||
    "User"

  return {
    data: {
      chatId,
      participants: {
        user1: { id: user1Id, username: resolveName(user1Id), role: "BUYER", profileImage: "" },
        user2: { id: user2Id, username: resolveName(user2Id), role: "SELLER", profileImage: "" },
      },
      messages: messages.map((msg: any) => ({
        id: msg.id || msg.messageId || `msg-${Date.now()}-${Math.random()}`,
        senderId: msg.senderId || "",
        senderName: msg.senderName || participantNames[msg.senderId] || resolveName(msg.senderId || ""),
        receiverId: msg.receiverId || "",
        receiverName: msg.receiverName || "",
        content: msg.content || "",
        timestamp: msg.timestamp || msg.createdAt || now,
        type: msg.type || "text",
        voiceUrl: msg.voiceUrl,
        voiceDuration: msg.voiceDuration,
      })),
      createdAt: now,
      lastMessageAt:
        messages.length > 0
          ? messages[messages.length - 1].timestamp ||
            messages[messages.length - 1].createdAt ||
            now
          : now,
      totalMessages: response.data?.totalMessages || messages.length,
    },
  }
}
