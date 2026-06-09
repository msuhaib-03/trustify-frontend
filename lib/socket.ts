"use client"

const USE_MOCK_API = true // Set to false when backend is ready

type MockSocket = {
  connected: boolean
  id: string
  auth: any
  connect: () => void
  disconnect: () => void
  emit: (event: string, ...args: any[]) => void
  on: (event: string, callback: Function) => void
  off: (event: string, callback: Function) => void
}

const listeners: Record<string, Function[]> = {}

const mockSocket: MockSocket = {
  connected: true,
  id: "mock-socket-id",
  auth: {},
  connect: () => {
    console.log("[v0] Mock socket connected")
  },
  disconnect: () => {
    console.log("[v0] Mock socket disconnected")
  },
  emit: (event: string, ...args: any[]) => {
    console.log("[v0] Mock socket emit:", event, args)

    // Simulate receiving message after sending
    if (event === "sendMessage") {
      const data = args[0]
      setTimeout(() => {
        const msgListeners = listeners["newMessage"] || []
        msgListeners.forEach((cb) =>
          cb({
            chatId: data.chatId,
            message: {
              id: `msg-${Date.now()}`,
              senderId: data.senderId,
              content: data.message,
              timestamp: new Date().toISOString(),
            },
          }),
        )
      }, 100)
    }
  },
  on: (event: string, callback: Function) => {
    if (!listeners[event]) {
      listeners[event] = []
    }
    listeners[event].push(callback)

    // Trigger connect event immediately
    if (event === "connect") {
      setTimeout(() => callback(), 10)
    }
  },
  off: (event: string, callback: Function) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((cb) => cb !== callback)
    }
  },
}

const realSocket: any = null

export const getSocket = (): MockSocket => {
  if (USE_MOCK_API) {
    return mockSocket
  }

  // Only import and use real socket when not in mock mode
  if (!realSocket) {
    // Dynamic import would be needed for real socket - for now return mock
    console.warn("[v0] Real socket not implemented - using mock")
    return mockSocket
  }

  return realSocket
}

export const connectSocket = (token: string) => {
  const s = getSocket()
  s.auth = { token }
  s.connect()
  return s
}

export const disconnectSocket = () => {
  const s = getSocket()
  if (s.connected) {
    s.disconnect()
  }
}

export const joinChatRoom = (chatId: string) => {
  const s = getSocket()
  s.emit("joinRoom", chatId)
}

export const leaveChatRoom = (chatId: string) => {
  const s = getSocket()
  s.emit("leaveRoom", chatId)
}

export const sendMessage = (chatId: string, message: string, senderId: string) => {
  const s = getSocket()
  s.emit("sendMessage", { chatId, message, senderId })
}

export const onNewMessage = (callback: (data: any) => void) => {
  const s = getSocket()
  s.on("newMessage", callback)
  return () => s.off("newMessage", callback)
}

export const onTyping = (callback: (data: { chatId: string; userId: string }) => void) => {
  const s = getSocket()
  s.on("typing", callback)
  return () => s.off("typing", callback)
}

export const emitTyping = (chatId: string, userId: string) => {
  const s = getSocket()
  s.emit("typing", { chatId, userId })
}
