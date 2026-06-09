/**
 * =====================================================
 * MOCK CHAT API
 * =====================================================
 * Provides all chat-related API functions using localStorage.
 * This single source of truth is shared between user chat and admin dashboard.
 *
 * To switch to real APIs:
 * 1. Set USE_MOCK = false
 * 2. Uncomment the REAL API sections
 * 3. Ensure your backend endpoints match the expected signatures
 * =====================================================
 */

const USE_MOCK = true // Set to false when backend is ready

// =====================================================
// SHARED STORAGE KEY - Single source of truth
// =====================================================
const CHAT_STORAGE_KEY = "trustify_unified_chat_data"

// =====================================================
// TYPE DEFINITIONS
// =====================================================
export interface ChatUser {
  id: string
  username: string
  email: string
  role: "BUYER" | "SELLER" | "RENTER"
  profileImage: string
  isOnline: boolean
  lastActive: string
}

export interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName: string
  senderImage?: string
  receiverId: string
  receiverName: string
  content: string
  type: "text" | "voice"
  voiceUrl?: string
  voiceDuration?: number
  createdAt: string
  read: boolean
}

export interface ChatConversation {
  chatId: string
  participants: {
    user1: ChatUser
    user2: ChatUser
  }
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  messages: ChatMessage[]
}

export interface ChatData {
  users: ChatUser[]
  conversations: ChatConversation[]
}

// =====================================================
// INITIAL MOCK DATA
// =====================================================
const createInitialData = (): ChatData => {
  const now = new Date()

  const users: ChatUser[] = [
    {
      id: "current-user",
      username: "You",
      email: "you@example.com",
      role: "BUYER",
      profileImage: "/current-user-avatar.png",
      isOnline: true,
      lastActive: now.toISOString(),
    },
    {
      id: "user-sarah",
      username: "Sarah Johnson",
      email: "sarah@example.com",
      role: "SELLER",
      profileImage: "/professional-woman-avatar.png",
      isOnline: true,
      lastActive: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: "user-mike",
      username: "Mike Chen",
      email: "mike@example.com",
      role: "BUYER",
      profileImage: "/casual-man-avatar.png",
      isOnline: false,
      lastActive: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "user-emily",
      username: "Emily Davis",
      email: "emily@example.com",
      role: "RENTER",
      profileImage: "/friendly-woman-avatar.jpg",
      isOnline: true,
      lastActive: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    },
  ]

  const conversations: ChatConversation[] = [
    {
      chatId: "chat-1",
      participants: {
        user1: users[0], // current-user
        user2: users[1], // Sarah
      },
      lastMessage: "Battery health is at 94%. I'll send the photos shortly.",
      lastMessageTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      unreadCount: 2,
      messages: [
        {
          id: "msg-1",
          chatId: "chat-1",
          senderId: "current-user",
          senderName: "You",
          receiverId: "user-sarah",
          receiverName: "Sarah Johnson",
          content: "Hi! I'm interested in the MacBook Pro. Is it still available?",
          type: "text",
          createdAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          read: true,
        },
        {
          id: "msg-2",
          chatId: "chat-1",
          senderId: "user-sarah",
          senderName: "Sarah Johnson",
          senderImage: users[1].profileImage,
          receiverId: "current-user",
          receiverName: "You",
          content: "Yes, it's still available! Would you like to see more photos?",
          type: "text",
          createdAt: new Date(now.getTime() - 55 * 60 * 1000).toISOString(),
          read: true,
        },
        {
          id: "msg-3",
          chatId: "chat-1",
          senderId: "current-user",
          senderName: "You",
          receiverId: "user-sarah",
          receiverName: "Sarah Johnson",
          content: "That would be great! Can you also tell me about the battery health?",
          type: "text",
          createdAt: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
          read: true,
        },
        {
          id: "msg-4",
          chatId: "chat-1",
          senderId: "user-sarah",
          senderName: "Sarah Johnson",
          senderImage: users[1].profileImage,
          receiverId: "current-user",
          receiverName: "You",
          content: "Battery health is at 94%. I'll send the photos shortly.",
          type: "text",
          createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          read: false,
        },
      ],
    },
    {
      chatId: "chat-2",
      participants: {
        user1: users[0], // current-user
        user2: users[2], // Mike
      },
      lastMessage: "Is the iPhone still available?",
      lastMessageTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
      messages: [
        {
          id: "msg-5",
          chatId: "chat-2",
          senderId: "user-mike",
          senderName: "Mike Chen",
          senderImage: users[2].profileImage,
          receiverId: "current-user",
          receiverName: "You",
          content: "Is the iPhone still available?",
          type: "text",
          createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          read: true,
        },
      ],
    },
    {
      chatId: "chat-3",
      participants: {
        user1: users[1], // Sarah
        user2: users[3], // Emily
      },
      lastMessage: "I can deliver it tomorrow if that works for you.",
      lastMessageTime: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      unreadCount: 0,
      messages: [
        {
          id: "msg-6",
          chatId: "chat-3",
          senderId: "user-emily",
          senderName: "Emily Davis",
          senderImage: users[3].profileImage,
          receiverId: "user-sarah",
          receiverName: "Sarah Johnson",
          content: "Hi Sarah! I saw your listing for the projector rental.",
          type: "text",
          createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
          read: true,
        },
        {
          id: "msg-7",
          chatId: "chat-3",
          senderId: "user-sarah",
          senderName: "Sarah Johnson",
          senderImage: users[1].profileImage,
          receiverId: "user-emily",
          receiverName: "Emily Davis",
          content: "I can deliver it tomorrow if that works for you.",
          type: "text",
          createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
          read: true,
        },
      ],
    },
  ]

  return { users, conversations }
}

// =====================================================
// STORAGE HELPERS
// =====================================================
const getData = (): ChatData => {
  if (typeof window === "undefined") return createInitialData()

  const stored = localStorage.getItem(CHAT_STORAGE_KEY)
  if (!stored) {
    const initial = createInitialData()
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(initial))
    return initial
  }
  return JSON.parse(stored)
}

const saveData = (data: ChatData): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(data))
}

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// =====================================================
// USER CHAT API FUNCTIONS
// =====================================================

/**
 * Get all conversations for a user
 *
 * REAL API (COMMENTED):
 * return await axios.get(`/api/chats/user/${userId}`)
 *
 * MOCK API (ACTIVE):
 */
export const getUserConversations = async (userId: string) => {
  if (USE_MOCK) {
    await delay(200)
    const data = getData()

    // Filter conversations where user is a participant
    const userConversations = data.conversations.filter(
      (conv) => conv.participants.user1.id === userId || conv.participants.user2.id === userId,
    )

    // Transform for user chat list view
    const transformed = userConversations.map((conv) => {
      const otherUser = conv.participants.user1.id === userId ? conv.participants.user2 : conv.participants.user1

      return {
        chatId: conv.chatId,
        recipientId: otherUser.id,
        recipientName: otherUser.username,
        recipientImage: otherUser.profileImage,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: conv.unreadCount,
        isOnline: otherUser.isOnline,
      }
    })

    return { data: { content: transformed, totalElements: transformed.length } }
  }

  // REAL API - Uncomment when backend is ready:
  // return await axios.get(`/api/chats/user/${userId}`)
  throw new Error("Real API not implemented")
}

/**
 * Get messages for a specific chat
 *
 * REAL API (COMMENTED):
 * return await axios.get(`/api/chats/${chatId}/messages`)
 *
 * MOCK API (ACTIVE):
 */
export const getChatMessages = async (chatId: string, userId: string) => {
  if (USE_MOCK) {
    await delay(150)
    const data = getData()

    const conversation = data.conversations.find((c) => c.chatId === chatId)
    if (!conversation) {
      return { data: { messages: [], otherUser: null } }
    }

    const otherUser =
      conversation.participants.user1.id === userId ? conversation.participants.user2 : conversation.participants.user1

    return {
      data: {
        messages: conversation.messages,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          profileImage: otherUser.profileImage,
          isOnline: otherUser.isOnline,
        },
      },
    }
  }

  throw new Error("Real API not implemented")
}

/**
 * Send a text message
 *
 * REAL API (COMMENTED):
 * return await axios.post(`/api/chats/${chatId}/messages`, { content, senderId })
 *
 * MOCK API (ACTIVE):
 */
export const sendTextMessage = async (
  chatId: string,
  senderId: string,
  content: string,
): Promise<{ data: ChatMessage }> => {
  if (USE_MOCK) {
    await delay(100)
    const data = getData()

    const conversation = data.conversations.find((c) => c.chatId === chatId)
    if (!conversation) throw new Error("Conversation not found")

    const sender =
      conversation.participants.user1.id === senderId
        ? conversation.participants.user1
        : conversation.participants.user2
    const receiver =
      conversation.participants.user1.id === senderId
        ? conversation.participants.user2
        : conversation.participants.user1

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId,
      senderName: sender.username,
      senderImage: sender.profileImage,
      receiverId: receiver.id,
      receiverName: receiver.username,
      content,
      type: "text",
      createdAt: new Date().toISOString(),
      read: false,
    }

    // Update conversation
    conversation.messages.push(newMessage)
    conversation.lastMessage = content
    conversation.lastMessageTime = newMessage.createdAt

    saveData(data)

    return { data: newMessage }
  }

  throw new Error("Real API not implemented")
}

/**
 * Send a voice message
 *
 * REAL API (COMMENTED):
 * const formData = new FormData()
 * formData.append('audio', audioBlob)
 * return await axios.post(`/api/chats/${chatId}/voice`, formData)
 *
 * MOCK API (ACTIVE):
 */
export const sendVoiceMessage = async (
  chatId: string,
  senderId: string,
  audioBlob: Blob,
  duration: number,
): Promise<{ data: ChatMessage }> => {
  if (USE_MOCK) {
    await delay(300)
    const data = getData()

    const conversation = data.conversations.find((c) => c.chatId === chatId)
    if (!conversation) throw new Error("Conversation not found")

    const sender =
      conversation.participants.user1.id === senderId
        ? conversation.participants.user1
        : conversation.participants.user2
    const receiver =
      conversation.participants.user1.id === senderId
        ? conversation.participants.user2
        : conversation.participants.user1

    const voiceUrl = URL.createObjectURL(audioBlob)

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId,
      senderName: sender.username,
      senderImage: sender.profileImage,
      receiverId: receiver.id,
      receiverName: receiver.username,
      content: "Voice message",
      type: "voice",
      voiceUrl,
      voiceDuration: duration,
      createdAt: new Date().toISOString(),
      read: false,
    }

    conversation.messages.push(newMessage)
    conversation.lastMessage = "🎤 Voice message"
    conversation.lastMessageTime = newMessage.createdAt

    saveData(data)

    return { data: newMessage }
  }

  throw new Error("Real API not implemented")
}

/**
 * Mark messages as read
 *
 * REAL API (COMMENTED):
 * return await axios.patch(`/api/chats/${chatId}/read`)
 *
 * MOCK API (ACTIVE):
 */
export const markMessagesAsRead = async (chatId: string, userId: string) => {
  if (USE_MOCK) {
    await delay(50)
    const data = getData()

    const conversation = data.conversations.find((c) => c.chatId === chatId)
    if (conversation) {
      conversation.messages.forEach((msg) => {
        if (msg.receiverId === userId) {
          msg.read = true
        }
      })
      conversation.unreadCount = 0
      saveData(data)
    }

    return { data: { success: true } }
  }

  throw new Error("Real API not implemented")
}

// =====================================================
// ADMIN CHAT API FUNCTIONS
// =====================================================

/**
 * Get all users with chat activity (for admin)
 *
 * REAL API (COMMENTED):
 * return await axios.get('/api/admin/chats/users')
 *
 * MOCK API (ACTIVE):
 */
export const getAdminChatUsers = async () => {
  if (USE_MOCK) {
    await delay(200)
    const data = getData()

    // Get unique users who have participated in any conversation
    const userMap = new Map<string, ChatUser & { totalChats: number }>()

    data.conversations.forEach((conv) => {
      ;[conv.participants.user1, conv.participants.user2].forEach((user) => {
        if (!userMap.has(user.id)) {
          userMap.set(user.id, { ...user, totalChats: 1 })
        } else {
          const existing = userMap.get(user.id)!
          existing.totalChats++
        }
      })
    })

    return { data: Array.from(userMap.values()) }
  }

  throw new Error("Real API not implemented")
}

/**
 * Get chat partners for a specific user (for admin)
 *
 * REAL API (COMMENTED):
 * return await axios.get(`/api/admin/chats/users/${userId}/partners`)
 *
 * MOCK API (ACTIVE):
 */
export const getAdminUserPartners = async (userId: string) => {
  if (USE_MOCK) {
    await delay(150)
    const data = getData()

    const userConversations = data.conversations.filter(
      (conv) => conv.participants.user1.id === userId || conv.participants.user2.id === userId,
    )

    const partners = userConversations.map((conv) => {
      const partner = conv.participants.user1.id === userId ? conv.participants.user2 : conv.participants.user1

      return {
        id: partner.id,
        username: partner.username,
        role: partner.role,
        profileImage: partner.profileImage,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        chatId: conv.chatId,
      }
    })

    return { data: partners }
  }

  throw new Error("Real API not implemented")
}

/**
 * Get full conversation history (for admin)
 *
 * REAL API (COMMENTED):
 * return await axios.get(`/api/admin/chats/${chatId}`)
 *
 * MOCK API (ACTIVE):
 */
export const getAdminChatHistory = async (chatId: string) => {
  if (USE_MOCK) {
    await delay(150)
    const data = getData()

    const conversation = data.conversations.find((c) => c.chatId === chatId)
    if (!conversation) {
      throw new Error("Conversation not found")
    }

    return {
      data: {
        chatId: conversation.chatId,
        participants: conversation.participants,
        messages: conversation.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.senderName,
          receiverId: m.receiverId,
          receiverName: m.receiverName,
          content: m.content,
          timestamp: m.createdAt,
          type: m.type,
          voiceUrl: m.voiceUrl,
          voiceDuration: m.voiceDuration,
        })),
        createdAt: conversation.messages[0]?.createdAt || new Date().toISOString(),
        lastMessageAt: conversation.lastMessageTime,
      },
    }
  }

  throw new Error("Real API not implemented")
}

/**
 * Get chat statistics (for admin)
 *
 * REAL API (COMMENTED):
 * return await axios.get('/api/admin/chats/stats')
 *
 * MOCK API (ACTIVE):
 */
export const getAdminChatStats = async () => {
  if (USE_MOCK) {
    await delay(100)
    const data = getData()

    const totalMessages = data.conversations.reduce((acc, conv) => acc + conv.messages.length, 0)
    const onlineUsers = data.users.filter((u) => u.isOnline).length

    return {
      data: {
        totalChats: data.conversations.length,
        activeUsers: onlineUsers,
        messagesLast24h: totalMessages,
        averageResponseTime: "5 min",
      },
    }
  }

  throw new Error("Real API not implemented")
}

// =====================================================
// HELPER: Create new conversation
// =====================================================
export const createConversation = async (user1Id: string, user2Id: string) => {
  if (USE_MOCK) {
    await delay(200)
    const data = getData()

    // Check if conversation already exists
    const existing = data.conversations.find(
      (c) =>
        (c.participants.user1.id === user1Id && c.participants.user2.id === user2Id) ||
        (c.participants.user1.id === user2Id && c.participants.user2.id === user1Id),
    )

    if (existing) {
      return { data: { chatId: existing.chatId } }
    }

    const user1 = data.users.find((u) => u.id === user1Id)
    const user2 = data.users.find((u) => u.id === user2Id)

    if (!user1 || !user2) throw new Error("User not found")

    const newConversation: ChatConversation = {
      chatId: `chat-${Date.now()}`,
      participants: { user1, user2 },
      lastMessage: "",
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      messages: [],
    }

    data.conversations.push(newConversation)
    saveData(data)

    return { data: { chatId: newConversation.chatId } }
  }

  throw new Error("Real API not implemented")
}
