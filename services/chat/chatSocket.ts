/**
 * =====================================================
 * REAL CHAT SOCKET SERVICE
 * =====================================================
 * Provides real-time chat functionality using Socket.io client
 * connecting to the Node.js WebSocket server.
 * 
 * WebSocket Server: ws://localhost:3001 (or NEXT_PUBLIC_CHAT_WS_URL)
 * 
 * Events:
 * - joinRoom: Join a chat room
 * - sendMessage: Send a message
 * - receiveMessage: Receive a message
 * - presence: User online/offline status
 * =====================================================
 */

import { io, Socket } from "socket.io-client"
import type { ChatMessage } from "./chatApi"

// WebSocket server URL — only connect if explicitly configured.
// When NEXT_PUBLIC_CHAT_WS_URL is not set we run in REST-only / polling mode.
const WS_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL || ""

// =====================================================
// EVENT TYPES
// =====================================================
type MessageCallback = (message: ChatMessage) => void
type PresenceCallback = (data: { userId: string; online: boolean }) => void
type TypingCallback = (data: { chatId: string; userId: string; username?: string }) => void
type ErrorCallback = (error: Error) => void
type ConnectionCallback = (connected: boolean) => void

// =====================================================
// CHAT SOCKET CLASS
// =====================================================
class ChatSocketService {
  private socket: Socket | null = null
  private isConnected = false
  private currentUserId: string | null = null
  private joinedRooms = new Set<string>()
  
  // Subscribers
  private messageSubscribers = new Map<string, Set<MessageCallback>>()
  private globalMessageSubscribers = new Set<MessageCallback>()
  private presenceSubscribers = new Set<PresenceCallback>()
  private typingSubscribers = new Map<string, Set<TypingCallback>>()
  private connectionSubscribers = new Set<ConnectionCallback>()
  private errorSubscribers = new Set<ErrorCallback>()

  /**
   * Connect to the WebSocket server with authentication
   */
  connect(token: string): void {
    if (!WS_URL) {
      console.log("[ChatSocket] No WS URL configured — running in REST-only mode")
      return
    }

    if (this.socket?.connected) {
      console.log("[ChatSocket] Already connected")
      return
    }

    console.log("[ChatSocket] Connecting to", WS_URL)

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    this.setupEventListeners()
  }

  /**
   * Setup socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return

    // Connection events
    this.socket.on("connect", () => {
      console.log("[ChatSocket] Connected")
      this.isConnected = true
      this.connectionSubscribers.forEach(cb => cb(true))
      
      // Rejoin previously joined rooms
      this.joinedRooms.forEach(roomId => {
        this.socket?.emit("joinRoom", roomId)
      })
    })

    this.socket.on("disconnect", (reason) => {
      console.log("[ChatSocket] Disconnected:", reason)
      this.isConnected = false
      this.connectionSubscribers.forEach(cb => cb(false))
    })

    this.socket.on("connect_error", (error) => {
      console.error("[ChatSocket] Connection error:", error.message)
      this.errorSubscribers.forEach(cb => cb(error))
    })

    // Message events
    this.socket.on("receiveMessage", (data: {
      chatId: string
      senderId: string
      message: string
      timestamp: Date | string
    }) => {
      console.log("[ChatSocket] Received message:", data)
      
      const message: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        chatId: data.chatId,
        senderId: data.senderId,
        senderName: data.senderId,
        content: data.message,
        type: "text",
        createdAt: typeof data.timestamp === "string" 
          ? data.timestamp 
          : new Date(data.timestamp).toISOString(),
        read: false,
      }

      // Notify chat-specific subscribers
      const chatSubscribers = this.messageSubscribers.get(data.chatId)
      if (chatSubscribers) {
        chatSubscribers.forEach(cb => cb(message))
      }

      // Notify global subscribers
      this.globalMessageSubscribers.forEach(cb => cb(message))
    })

    // Presence events
    this.socket.on("presence", (data: { userId: string; online: boolean }) => {
      console.log("[ChatSocket] Presence update:", data)
      this.presenceSubscribers.forEach(cb => cb(data))
    })

    // Typing events (if implemented on server)
    this.socket.on("typing", (data: { chatId: string; userId: string }) => {
      const subscribers = this.typingSubscribers.get(data.chatId)
      if (subscribers) {
        subscribers.forEach(cb => cb(data))
      }
    })
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.joinedRooms.clear()
      console.log("[ChatSocket] Disconnected")
    }
  }

  /**
   * Check if connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * Join a chat room
   */
  joinRoom(chatId: string): void {
    if (!this.socket?.connected) {
      console.warn("[ChatSocket] Cannot join room - not connected")
      this.joinedRooms.add(chatId) // Queue for when connected
      return
    }

    console.log("[ChatSocket] Joining room:", chatId)
    this.socket.emit("joinRoom", chatId)
    this.joinedRooms.add(chatId)
  }

  /**
   * Leave a chat room
   */
  leaveRoom(chatId: string): void {
    if (!this.socket?.connected) return

    console.log("[ChatSocket] Leaving room:", chatId)
    this.socket.emit("leaveRoom", chatId)
    this.joinedRooms.delete(chatId)
  }

  /**
   * Send a message via WebSocket
   */
  sendMessage(chatId: string, message: string): void {
    if (!this.socket?.connected) {
      console.warn("[ChatSocket] Cannot send message - not connected")
      return
    }

    console.log("[ChatSocket] Sending message to room:", chatId)
    this.socket.emit("sendMessage", { chatId, message })
  }

  /**
   * Emit typing event
   */
  emitTyping(chatId: string, userId: string, username?: string): void {
    if (!this.socket?.connected) return
    this.socket.emit("typing", { chatId, userId, username })
  }

  // =====================================================
  // SUBSCRIPTION METHODS
  // =====================================================

  /**
   * Subscribe to messages for a specific chat
   */
  subscribeToChat(chatId: string, callback: MessageCallback): () => void {
    if (!this.messageSubscribers.has(chatId)) {
      this.messageSubscribers.set(chatId, new Set())
    }
    this.messageSubscribers.get(chatId)!.add(callback)

    // Join the room if connected
    this.joinRoom(chatId)

    return () => {
      this.messageSubscribers.get(chatId)?.delete(callback)
    }
  }

  /**
   * Subscribe to all messages (for chat list updates)
   */
  subscribeToAllMessages(callback: MessageCallback): () => void {
    this.globalMessageSubscribers.add(callback)
    return () => {
      this.globalMessageSubscribers.delete(callback)
    }
  }

  /**
   * Subscribe to presence updates
   */
  subscribeToPresence(callback: PresenceCallback): () => void {
    this.presenceSubscribers.add(callback)
    return () => {
      this.presenceSubscribers.delete(callback)
    }
  }

  /**
   * Subscribe to typing events for a chat
   */
  subscribeToTyping(chatId: string, callback: TypingCallback): () => void {
    if (!this.typingSubscribers.has(chatId)) {
      this.typingSubscribers.set(chatId, new Set())
    }
    this.typingSubscribers.get(chatId)!.add(callback)

    return () => {
      this.typingSubscribers.get(chatId)?.delete(callback)
    }
  }

  /**
   * Subscribe to connection status changes
   */
  subscribeToConnection(callback: ConnectionCallback): () => void {
    this.connectionSubscribers.add(callback)
    // Immediately call with current status
    callback(this.isConnected)
    return () => {
      this.connectionSubscribers.delete(callback)
    }
  }

  /**
   * Subscribe to errors
   */
  subscribeToErrors(callback: ErrorCallback): () => void {
    this.errorSubscribers.add(callback)
    return () => {
      this.errorSubscribers.delete(callback)
    }
  }

  /**
   * Broadcast a message locally (for optimistic updates)
   * This notifies local subscribers without going through the server
   */
  broadcastMessage(message: ChatMessage): void {
    // Notify chat-specific subscribers
    const chatSubscribers = this.messageSubscribers.get(message.chatId)
    if (chatSubscribers) {
      chatSubscribers.forEach(cb => cb(message))
    }

    // Notify global subscribers
    this.globalMessageSubscribers.forEach(cb => cb(message))
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================
export const chatSocket = new ChatSocketService()

// Export types
export type { MessageCallback, PresenceCallback, TypingCallback }
