"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, User, MoreVertical, Phone, Video, Info, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/back-button"
import { useAuth } from "@/context/auth-context"
import { format, isToday, isYesterday } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { VoiceRecorder } from "@/components/chat/voice-recorder"
import { VoiceMessage } from "@/components/chat/voice-message"
import { ChatSuggestions } from "@/components/chat/chat-suggestions"

import {
  getChatMessages,
  sendTextMessage,
  sendVoiceMessage as sendVoiceMessageApi,
  markMessagesAsRead,
  type ChatMessage,
} from "@/services/chat/chatApi"

interface OtherUser {
  id: string
  username: string
  profileImage?: string
  isOnline?: boolean
}

export default function ChatWindowPage() {
  const params = useParams()
  const chatId = params.id as string
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const userId = user?.id || user?.email || "current-user"

  useEffect(() => {
    if (chatId && user) {
      fetchMessages(true)

      // Poll for new messages every 3 s (REST-only mode, no WebSocket server needed)
      const pollInterval = setInterval(() => fetchMessages(), 3000)

      return () => clearInterval(pollInterval)
    }
  }, [chatId, user, userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const hasUserMessage = messages.some((m) => m.senderId === userId || m.senderId === "current-user")
    setShowSuggestions(!hasUserMessage && messages.length < 3)
  }, [messages, userId])

  const fetchMessages = async (initial = false) => {
    try {
      const response = await getChatMessages(chatId, userId)
      const fetched = response.data.messages || []

      setMessages((prev) => {
        // Skip re-render if nothing new arrived
        if (!initial && prev.length === fetched.length) return prev
        return fetched
      })

      if (initial) {
        setOtherUser(response.data.otherUser)
        await markMessagesAsRead(chatId, userId)
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    setIsSending(true)

    // Create optimistic message for immediate UI update
    const optimisticMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId: userId,
      senderName: user?.email || "You",
      content: messageContent,
      type: "text",
      createdAt: new Date().toISOString(),
      read: false,
    }

    // Add message to local state immediately (optimistic update)
    setMessages((prev) => [...prev, optimisticMessage])

    try {
      // Send via REST directly to Spring Boot (no Node.js WS server required)
      await sendTextMessage(chatId, userId, messageContent)
    } catch (error) {
      console.error("Failed to send message:", error)
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleSendVoice = async (audioBlob: Blob, duration: number) => {
    try {
      // For voice messages, we still use REST API since we need to upload the audio
      const response = await sendVoiceMessageApi(chatId, userId, audioBlob, duration)

      setMessages((prev) => [...prev, response.data])

    } catch (error) {
      console.error("Failed to send voice message:", error)
      throw error
    }
  }

  const handleSuggestionSelect = (suggestion: string) => {
    setNewMessage(suggestion)
    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
  }

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    return format(date, "MMMM d, yyyy")
  }

  const getMessageGroups = () => {
    const groups: { date: string; messages: ChatMessage[] }[] = []
    let currentDate = ""

    messages.forEach((message) => {
      const messageDate = formatMessageDate(message.createdAt)
      if (messageDate !== currentDate) {
        currentDate = messageDate
        groups.push({ date: messageDate, messages: [message] })
      } else {
        groups[groups.length - 1].messages.push(message)
      }
    })

    return groups
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        <div className="border-b p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <BackButton fallbackUrl="/chat" />
            <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
            <Skeleton className="h-5 w-24 sm:w-32" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <Skeleton className="h-12 w-36 sm:w-48 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const messageGroups = getMessageGroups()

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      <div className="border-b bg-card/80 backdrop-blur-sm p-3 sm:p-4 flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <BackButton fallbackUrl="/chat" />
            <div className="relative">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 ring-2 ring-background">
                <AvatarImage src={otherUser?.profileImage || "/placeholder.svg"} />
                <AvatarFallback>
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </AvatarFallback>
              </Avatar>
              {otherUser?.isOnline && (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base truncate">{otherUser?.username || "User"}</h3>
              <p className="text-xs text-muted-foreground">
                {isTyping ? "typing..." : otherUser?.isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 sm:h-10 sm:w-10">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 sm:h-10 sm:w-10">
              <Video className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                  <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="sm:hidden">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </DropdownMenuItem>
                <DropdownMenuItem className="sm:hidden">
                  <Video className="h-4 w-4 mr-2" />
                  Video Call
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Info className="h-4 w-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <ChatSuggestions onSelect={handleSuggestionSelect} show={showSuggestions} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-4">
        <AnimatePresence>
          {messageGroups.map((group) => (
            <div key={group.date} className="space-y-3">
              {/* Date separator */}
              <div className="flex items-center justify-center">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{group.date}</span>
              </div>

              {/* Messages */}
              {group.messages.map((message, index) => {
                const isOwn = message.senderId === userId || message.senderId === "current-user"

                return (
                  <motion.div
                    key={message.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 sm:px-4 py-2 shadow-sm ${
                        isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
                      }`}
                    >
                      {message.type === "voice" ? (
                        <VoiceMessage audioUrl={message.voiceUrl} duration={message.voiceDuration || 0} isOwn={isOwn} />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      )}

                      {/* Timestamp and read status */}
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 ${
                          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        <span className="text-[10px]">{format(new Date(message.createdAt), "HH:mm")}</span>
                        {isOwn && (message.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <motion.span
                  className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                />
                <motion.span
                  className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                />
                <motion.span
                  className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 0.6, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-card/80 backdrop-blur-sm p-3 sm:p-4 flex-shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            className="flex-1 text-sm sm:text-base"
            disabled={isSending}
          />

          {/* Show voice recorder when no text, send button when there's text */}
          {newMessage.trim() ? (
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || isSending}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          ) : (
            <VoiceRecorder onSend={handleSendVoice} disabled={isSending} />
          )}
        </form>
      </div>
    </div>
  )
}
