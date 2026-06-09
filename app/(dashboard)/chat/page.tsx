"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { MessageSquare, Search, User, Circle, Mic } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/back-button"
import { useAuth } from "@/context/auth-context"
import { formatDistanceToNow } from "date-fns"

import { getUserConversations, createChat } from "@/services/chat/chatApi"

interface ChatListItem {
  chatId: string
  recipientId: string
  recipientName: string
  recipientImage: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
}

export default function ChatPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [chats, setChats] = useState<ChatListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const userId = user?.id || user?.email || "current-user"

  // Handle legacy ?user=otherId links — create/find the chat and redirect to the window
  useEffect(() => {
    const otherUserId = searchParams.get("user")
    if (otherUserId && user) {
      createChat([userId, otherUserId])
        .then((res) => router.replace(`/chat/${res.data.id}`))
        .catch(() => { /* fall through to normal chat list */ })
    }
  }, [searchParams, user, userId])

  useEffect(() => {
    fetchChats()

    // Poll for conversation list updates every 5 s (REST-only mode)
    const pollInterval = setInterval(fetchChats, 5000)
    return () => clearInterval(pollInterval)
  }, [userId])

  const fetchChats = async () => {
    try {
      const response = await getUserConversations(userId)
      const conversationsData = response?.data?.content
      setChats(Array.isArray(conversationsData) ? conversationsData : [])
    } catch (error) {
      console.error("Failed to fetch chats:", error)
      setChats([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredChats = Array.isArray(chats)
    ? chats.filter(
        (chat) =>
          chat.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : []

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex items-center gap-4 min-w-0">
        <BackButton fallbackUrl="/home" />
        <h1 className="text-xl sm:text-2xl font-bold truncate">Messages</h1>
      </div>

      {/* Search */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      {/* Chat List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredChats.length > 0 ? (
        <div className="space-y-2">
          {filteredChats.map((chat, index) => (
            <motion.div
              key={chat.chatId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/chat/${chat.chatId}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer hover:shadow-md">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-background">
                          <AvatarImage src={chat.recipientImage || "/placeholder.svg"} />
                          <AvatarFallback>
                            <User className="h-4 w-4 sm:h-5 sm:w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <Circle
                          className={`absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                            chat.isOnline ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold truncate text-sm sm:text-base">{chat.recipientName}</h4>
                          {chat.lastMessageTime && (
                            <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                              {formatDistanceToNow(new Date(chat.lastMessageTime), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1">
                            {chat.lastMessage?.startsWith("🎤") && <Mic className="h-3 w-3 flex-shrink-0" />}
                            {chat.lastMessage || "No messages yet"}
                          </p>
                          {chat.unreadCount > 0 && (
                            <Badge className="bg-primary text-primary-foreground h-5 min-w-5 flex items-center justify-center flex-shrink-0 text-xs">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="p-8 sm:p-12 text-center bg-gradient-to-br from-muted/50 to-muted">
          <MessageSquare className="h-10 sm:h-12 w-10 sm:w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="text-base sm:text-lg font-semibold mb-2">No conversations yet</h4>
          <p className="text-sm text-muted-foreground">Start a conversation by contacting a seller from a listing</p>
        </Card>
      )}
    </div>
  )
}
