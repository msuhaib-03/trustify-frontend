/**
 * =====================================================
 * MOCK CHAT SOCKET SERVICE
 * =====================================================
 * Provides real-time event broadcasting for chat system.
 * This simulates Socket.io behavior for instant updates across all subscribers.
 *
 * To switch to real WebSocket:
 * 1. Replace mock implementations with Socket.io client
 * 2. Connect to your WebSocket server
 * 3. Map events to your server's event names
 * =====================================================
 */

import type { ChatMessage, ChatConversation } from "./mockChatApi"

// =====================================================
// EVENT TYPES
// =====================================================
type MessageCallback = (message: ChatMessage) => void
type ConversationCallback = (conversation: ChatConversation) => void
type TypingCallback = (data: { chatId: string; userId: string; username: string }) => void
type AdminUpdateCallback = (data: { type: string; payload: any }) => void

// =====================================================
// SUBSCRIBER STORAGE
// =====================================================
const messageSubscribers = new Map<string, Set<MessageCallback>>()
const globalMessageSubscribers = new Set<MessageCallback>()
const conversationSubscribers = new Set<ConversationCallback>()
const typingSubscribers = new Map<string, Set<TypingCallback>>()
const adminSubscribers = new Set<AdminUpdateCallback>()

// =====================================================
// MOCK SOCKET CLASS
// =====================================================
class MockChatSocket {
  private isConnected = false

  /**
   * Connect to the mock socket
   *
   * REAL SOCKET (COMMENTED):
   * this.socket = io(SOCKET_URL, { auth: { token } })
   *
   * MOCK SOCKET (ACTIVE):
   */
  connect(): void {
    this.isConnected = true
    console.log("[MockChatSocket] Connected")
  }

  /**
   * Disconnect from the mock socket
   */
  disconnect(): void {
    this.isConnected = false
    console.log("[MockChatSocket] Disconnected")
  }

  // =====================================================
  // MESSAGE SUBSCRIPTIONS
  // =====================================================

  /**
   * Subscribe to messages for a specific chat
   *
   * REAL SOCKET (COMMENTED):
   * socket.on(`chat:${chatId}:message`, callback)
   *
   * MOCK SOCKET (ACTIVE):
   */
  subscribeToChat(chatId: string, callback: MessageCallback): () => void {
    if (!messageSubscribers.has(chatId)) {
      messageSubscribers.set(chatId, new Set())
    }
    messageSubscribers.get(chatId)!.add(callback)

    // Return unsubscribe function
    return () => {
      messageSubscribers.get(chatId)?.delete(callback)
    }
  }

  /**
   * Subscribe to ALL new messages (for admin monitoring)
   *
   * REAL SOCKET (COMMENTED):
   * socket.on('message:new', callback)
   *
   * MOCK SOCKET (ACTIVE):
   */
  subscribeToAllMessages(callback: MessageCallback): () => void {
    globalMessageSubscribers.add(callback)
    return () => {
      globalMessageSubscribers.delete(callback)
    }
  }

  /**
   * Subscribe to conversation updates
   */
  subscribeToConversations(callback: ConversationCallback): () => void {
    conversationSubscribers.add(callback)
    return () => {
      conversationSubscribers.delete(callback)
    }
  }

  /**
   * Subscribe to admin updates (new chats, new messages, etc.)
   *
   * REAL SOCKET (COMMENTED):
   * socket.on('admin:update', callback)
   *
   * MOCK SOCKET (ACTIVE):
   */
  subscribeToAdminUpdates(callback: AdminUpdateCallback): () => void {
    adminSubscribers.add(callback)
    return () => {
      adminSubscribers.delete(callback)
    }
  }

  // =====================================================
  // TYPING INDICATORS
  // =====================================================

  /**
   * Subscribe to typing events for a chat
   */
  subscribeToTyping(chatId: string, callback: TypingCallback): () => void {
    if (!typingSubscribers.has(chatId)) {
      typingSubscribers.set(chatId, new Set())
    }
    typingSubscribers.get(chatId)!.add(callback)

    return () => {
      typingSubscribers.get(chatId)?.delete(callback)
    }
  }

  /**
   * Emit typing event
   *
   * REAL SOCKET (COMMENTED):
   * socket.emit('typing', { chatId, userId, username })
   *
   * MOCK SOCKET (ACTIVE):
   */
  emitTyping(chatId: string, userId: string, username: string): void {
    const subscribers = typingSubscribers.get(chatId)
    if (subscribers) {
      subscribers.forEach((cb) => cb({ chatId, userId, username }))
    }
  }

  // =====================================================
  // BROADCAST FUNCTIONS (Called after API operations)
  // =====================================================

  /**
   * Broadcast a new message to all relevant subscribers
   * This is called after sendTextMessage/sendVoiceMessage succeeds
   */
  broadcastMessage(message: ChatMessage): void {
    // Notify chat-specific subscribers
    const chatSubscribers = messageSubscribers.get(message.chatId)
    if (chatSubscribers) {
      chatSubscribers.forEach((cb) => cb(message))
    }

    // Notify global subscribers (admin)
    globalMessageSubscribers.forEach((cb) => cb(message))

    // Notify admin update subscribers
    adminSubscribers.forEach((cb) =>
      cb({
        type: "NEW_MESSAGE",
        payload: message,
      }),
    )
  }

  /**
   * Broadcast conversation update (new conversation created, etc.)
   */
  broadcastConversationUpdate(conversation: ChatConversation): void {
    conversationSubscribers.forEach((cb) => cb(conversation))

    adminSubscribers.forEach((cb) =>
      cb({
        type: "CONVERSATION_UPDATE",
        payload: conversation,
      }),
    )
  }

  /**
   * Simulate receiving a message from another user
   * Used for demo/testing purposes
   */
  simulateIncomingMessage(chatId: string, message: Omit<ChatMessage, "id" | "createdAt">): void {
    const fullMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    this.broadcastMessage(fullMessage)
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================
export const mockChatSocket = new MockChatSocket()

// Auto-connect on import
if (typeof window !== "undefined") {
  mockChatSocket.connect()
}
