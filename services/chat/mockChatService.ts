/**
 * =====================================================
 * MOCK CHAT SERVICE
 * =====================================================
 * This service provides mock implementations for chat functionality.
 * All mock functions are clearly marked and can be easily replaced
 * with real API calls when the backend is ready.
 *
 * To switch to real APIs:
 * 1. Set USE_MOCK = false
 * 2. Uncomment the real API implementations
 * 3. Ensure your backend endpoints match the expected signatures
 * =====================================================
 */

const USE_MOCK = true // Set to false when backend is ready

// =====================================================
// MOCK DATA - Replace with database when ready
// =====================================================
const STORAGE_KEY = "trustify_chat_data"

interface ChatMessage {
  id: string
  chatId: string
  senderId: string
  senderName: string
  content: string
  type: "text" | "voice"
  voiceUrl?: string
  voiceDuration?: number
  createdAt: string
  read: boolean
}

interface ChatConversation {
  chatId: string
  recipientId: string
  recipientName: string
  recipientImage: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
}

interface ChatData {
  conversations: ChatConversation[]
  messages: ChatMessage[]
}

// Initial mock data
const initialMockData: ChatData = {
  conversations: [
    {
      chatId: "chat-1",
      recipientId: "user-2",
      recipientName: "Sarah Johnson",
      recipientImage: "/professional-woman-avatar.png",
      lastMessage: "Thanks for the quick response!",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
      unreadCount: 2,
      isOnline: true,
    },
    {
      chatId: "chat-2",
      recipientId: "user-3",
      recipientName: "Mike Chen",
      recipientImage: "/casual-man-avatar.png",
      lastMessage: "Is the iPhone still available?",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      unreadCount: 0,
      isOnline: false,
    },
    {
      chatId: "chat-3",
      recipientId: "user-4",
      recipientName: "Emily Davis",
      recipientImage: "/woman-friendly-avatar.jpg",
      lastMessage: "Can we negotiate the price?",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      unreadCount: 1,
      isOnline: true,
    },
  ],
  messages: [
    // Chat 1 messages
    {
      id: "msg-1",
      chatId: "chat-1",
      senderId: "current-user",
      senderName: "You",
      content: "Hi! I'm interested in the MacBook Pro. Is it still available?",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      read: true,
    },
    {
      id: "msg-2",
      chatId: "chat-1",
      senderId: "user-2",
      senderName: "Sarah Johnson",
      content: "Yes, it's still available! Would you like to see more photos?",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
      read: true,
    },
    {
      id: "msg-3",
      chatId: "chat-1",
      senderId: "current-user",
      senderName: "You",
      content: "That would be great! Can you also tell me about the battery health?",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      read: true,
    },
    {
      id: "msg-4",
      chatId: "chat-1",
      senderId: "user-2",
      senderName: "Sarah Johnson",
      content:
        "Battery health is at 94%. I'll send the photos shortly. The laptop has been well maintained and comes with the original charger.",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      read: true,
    },
    {
      id: "msg-5",
      chatId: "chat-1",
      senderId: "user-2",
      senderName: "Sarah Johnson",
      content: "Thanks for the quick response!",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
    },
    // Chat 2 messages
    {
      id: "msg-6",
      chatId: "chat-2",
      senderId: "user-3",
      senderName: "Mike Chen",
      content: "Is the iPhone still available?",
      type: "text",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read: true,
    },
  ],
}

// Helper to get/set data from localStorage
const getData = (): ChatData => {
  if (typeof window === "undefined") return initialMockData
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockData))
    return initialMockData
  }
  return JSON.parse(stored)
}

const saveData = (data: ChatData) => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// =====================================================
// MOCK CHAT API - Replace with real API calls
// =====================================================

/**
 * Get all chat conversations for a user
 *
 * REAL API (COMMENTED):
 * return await axios.get(`/api/chats/user/${userId}`, { params })
 *
 * MOCK API (ACTIVE):
 */
export const getConversations = async (
  userId: string,
  params?: { page?: number; size?: number },
): Promise<{ data: { content: ChatConversation[]; totalElements: number } }> => {
  if (USE_MOCK) {
    await delay(300) // Simulate network delay
    const data = getData()
    return {
      data: {
        content: data.conversations,
        totalElements: data.conversations.length,
      },
    }
  }

  // REAL API - Uncomment when ready:
  // return await axios.get(`/api/chats/user/${userId}`, { params })
  throw new Error("Real API not implemented")
}

/**
 * Get messages for a specific chat
 *
 * REAL API (COMMENTED):
 * return await axios.get(`/api/chats/${chatId}/messages`, { params })
 *
 * MOCK API (ACTIVE):
 */
export const getMessages = async (
  chatId: string,
  params?: { page?: number; size?: number },
): Promise<{ data: { messages: ChatMessage[]; otherUser: any } }> => {
  if (USE_MOCK) {
    await delay(200)
    const data = getData()
    const messages = data.messages.filter((m) => m.chatId === chatId)
    const conversation = data.conversations.find((c) => c.chatId === chatId)

    return {
      data: {
        messages,
        otherUser: conversation
          ? {
              id: conversation.recipientId,
              username: conversation.recipientName,
              profileImage: conversation.recipientImage,
              isOnline: conversation.isOnline,
            }
          : null,
      },
    }
  }

  throw new Error("Real API not implemented")
}

/**
 * Send a text message
 *
 * REAL API (COMMENTED):
 * return await axios.post(`/api/chats/${chatId}/messages`, messageData)
 *
 * MOCK API (ACTIVE):
 */
export const sendMessage = async (
  chatId: string,
  messageData: { senderId: string; content: string },
): Promise<{ data: ChatMessage }> => {
  if (USE_MOCK) {
    await delay(150)
    const data = getData()

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      chatId,
      senderId: messageData.senderId,
      senderName: "You",
      content: messageData.content,
      type: "text",
      createdAt: new Date().toISOString(),
      read: false,
    }

    data.messages.push(newMessage)

    // Update conversation's last message
    const conversation = data.conversations.find((c) => c.chatId === chatId)
    if (conversation) {
      conversation.lastMessage = messageData.content
      conversation.lastMessageTime = newMessage.createdAt
    }

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
 * formData.append('duration', duration.toString())
 * return await axios.post(`/api/chats/${chatId}/voice`, formData)
 *
 * MOCK API (ACTIVE):
 */
export const sendVoiceMessage = async (
  chatId: string,
  voiceData: { senderId: string; audioBlob: Blob; duration: number },
): Promise<{ data: ChatMessage }> => {
  if (USE_MOCK) {
    await delay(500) // Longer delay to simulate upload
    const data = getData()

    // Create a blob URL for the audio (in real app, this would be a server URL)
    const voiceUrl = URL.createObjectURL(voiceData.audioBlob)

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      chatId,
      senderId: voiceData.senderId,
      senderName: "You",
      content: "Voice message",
      type: "voice",
      voiceUrl,
      voiceDuration: voiceData.duration,
      createdAt: new Date().toISOString(),
      read: false,
    }

    data.messages.push(newMessage)

    // Update conversation's last message
    const conversation = data.conversations.find((c) => c.chatId === chatId)
    if (conversation) {
      conversation.lastMessage = "🎤 Voice message"
      conversation.lastMessageTime = newMessage.createdAt
    }

    saveData(data)

    return { data: newMessage }
  }

  throw new Error("Real API not implemented")
}

/**
 * Mark messages as read
 *
 * REAL API (COMMENTED):
 * return await axios.patch(`/api/chats/${chatId}/read`, { userId })
 *
 * MOCK API (ACTIVE):
 */
export const markAsRead = async (chatId: string, userId: string): Promise<{ data: { success: boolean } }> => {
  if (USE_MOCK) {
    await delay(100)
    const data = getData()

    // Mark all messages in this chat as read
    data.messages.forEach((m) => {
      if (m.chatId === chatId && m.senderId !== userId) {
        m.read = true
      }
    })

    // Reset unread count
    const conversation = data.conversations.find((c) => c.chatId === chatId)
    if (conversation) {
      conversation.unreadCount = 0
    }

    saveData(data)

    return { data: { success: true } }
  }

  throw new Error("Real API not implemented")
}

/**
 * Create a new chat conversation
 *
 * REAL API (COMMENTED):
 * return await axios.post('/api/chats', { participants })
 *
 * MOCK API (ACTIVE):
 */
export const createConversation = async (participants: string[]): Promise<{ data: { chatId: string } }> => {
  if (USE_MOCK) {
    await delay(300)
    const chatId = `chat-${Date.now()}`
    return { data: { chatId } }
  }

  throw new Error("Real API not implemented")
}

// =====================================================
// MOCK SOCKET SERVICE - For real-time updates
// =====================================================

type MessageCallback = (message: ChatMessage) => void
type TypingCallback = (data: { chatId: string; userId: string }) => void

const messageListeners: MessageCallback[] = []
const typingListeners: TypingCallback[] = []

/**
 * Subscribe to new messages
 *
 * REAL SOCKET (COMMENTED):
 * socket.on('newMessage', callback)
 *
 * MOCK SOCKET (ACTIVE):
 */
export const onNewMessage = (callback: MessageCallback) => {
  messageListeners.push(callback)
  return () => {
    const index = messageListeners.indexOf(callback)
    if (index > -1) messageListeners.splice(index, 1)
  }
}

/**
 * Subscribe to typing events
 */
export const onTyping = (callback: TypingCallback) => {
  typingListeners.push(callback)
  return () => {
    const index = typingListeners.indexOf(callback)
    if (index > -1) typingListeners.splice(index, 1)
  }
}

/**
 * Broadcast a new message to all listeners (mock real-time)
 */
export const broadcastMessage = (message: ChatMessage) => {
  messageListeners.forEach((cb) => cb(message))
}

/**
 * Emit typing event
 */
export const emitTyping = (chatId: string, userId: string) => {
  typingListeners.forEach((cb) => cb({ chatId, userId }))
}

// Export types
export type { ChatMessage, ChatConversation }
