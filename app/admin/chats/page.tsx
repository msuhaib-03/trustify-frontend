"use client"

import { useState, useEffect, useCallback } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  MessageSquare,
  Search,
  Users,
  Clock,
  ChevronRight,
  ArrowLeft,
  Eye,
  MessageCircle,
  Activity,
  User,
  Mic,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

import {
  getAdminChatUsers,
  getAdminUserPartners,
  getAdminChatHistory,
  getAdminChatStats,
  type ChatUser,
} from "@/services/chat/chatApi"
import { chatSocket } from "@/services/chat/chatSocket"

// View states for the chat monitoring system
type ViewState = "users" | "partners" | "conversation"

interface ChatPartner {
  id: string
  username: string
  role: string
  profileImage: string
  lastMessage: string
  lastMessageTime: string
  chatId: string
}

interface ChatConversation {
  chatId: string
  participants: {
    user1: { id: string; username: string; role: string; profileImage: string }
    user2: { id: string; username: string; role: string; profileImage: string }
  }
  messages: Array<{
    id: string
    senderId: string
    senderName: string
    receiverId: string
    receiverName: string
    content: string
    timestamp: string
    type?: string
    voiceUrl?: string
    voiceDuration?: number
  }>
  createdAt: string
  lastMessageAt: string
}

export default function AdminChatsPage() {
  // State management
  const [viewState, setViewState] = useState<ViewState>("users")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Data states
  const [users, setUsers] = useState<(ChatUser & { totalChats: number })[]>([])
  const [filteredUsers, setFilteredUsers] = useState<(ChatUser & { totalChats: number })[]>([])
  const [selectedUser, setSelectedUser] = useState<(ChatUser & { totalChats: number }) | null>(null)
  const [partners, setPartners] = useState<ChatPartner[]>([])
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null)
  const [conversation, setConversation] = useState<ChatConversation | null>(null)

  // Stats
  const [stats, setStats] = useState({
    totalChats: 0,
    activeUsers: 0,
    messagesLast24h: 0,
    averageResponseTime: "0 min",
  })

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (token) {
      chatSocket.connect(token)
    }

    fetchData()

    // Subscribe to all messages for real-time updates
    const unsubscribeMessages = chatSocket.subscribeToAllMessages((message) => {
      if (viewState === "conversation" && conversation && message.chatId === conversation.chatId) {
        // Add new message to conversation view
        setConversation((prev) => {
          if (!prev) return prev
          const newMsg = {
            id: message.id,
            senderId: message.senderId,
            senderName: message.senderName || message.senderId,
            receiverId: message.receiverId || "",
            receiverName: message.receiverName || "",
            content: message.content,
            timestamp: message.createdAt,
            type: message.type,
            voiceUrl: message.voiceUrl,
            voiceDuration: message.voiceDuration,
          }
          // Check if message already exists
          if (prev.messages.some((m) => m.id === newMsg.id)) return prev
          return {
            ...prev,
            messages: [...prev.messages, newMsg],
            lastMessageAt: message.createdAt,
          }
        })
      } else {
        // Refresh data when new messages arrive
        fetchData()
      }
    })

    return () => {
      unsubscribeMessages()
    }
  }, [viewState, conversation, selectedUser])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, statsRes] = await Promise.all([getAdminChatUsers(), getAdminChatStats()])
      setUsers(usersRes.data)
      setFilteredUsers(usersRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error("Error fetching chat data:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshPartners = async (userId: string) => {
    try {
      const res = await getAdminUserPartners(userId)
      setPartners(res.data)
    } catch (error) {
      console.error("Error refreshing partners:", error)
    }
  }

  const refreshConversation = async (chatId: string) => {
    try {
      const res = await getAdminChatHistory(chatId)
      setConversation(res.data)
    } catch (error) {
      console.error("Error refreshing conversation:", error)
    }
  }

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredUsers(filtered)
    }
  }, [searchQuery, users])

  // Handle user selection (Level 1 -> Level 2)
  const handleSelectUser = useCallback(async (user: ChatUser & { totalChats: number }) => {
    setSelectedUser(user)
    setLoading(true)
    try {
      const res = await getAdminUserPartners(user.id)
      setPartners(res.data)
      setViewState("partners")
    } catch (error) {
      console.error("Error fetching chat partners:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle conversation selection (Level 2 -> Full Chat)
  const handleSelectConversation = useCallback(async (partner: ChatPartner) => {
    setSelectedPartner(partner)
    setLoading(true)
    try {
      const res = await getAdminChatHistory(partner.chatId)
      setConversation(res.data)
      setViewState("conversation")
    } catch (error) {
      console.error("Error fetching conversation:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Navigation handlers
  const handleBackToUsers = useCallback(() => {
    setViewState("users")
    setSelectedUser(null)
    setPartners([])
    setSelectedPartner(null)
    setConversation(null)
  }, [])

  const handleBackToPartners = useCallback(() => {
    setViewState("partners")
    setSelectedPartner(null)
    setConversation(null)
  }, [])

  // Role badge color helper
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "BUYER":
        return "default"
      case "SELLER":
        return "secondary"
      case "RENTER":
        return "outline"
      default:
        return "default"
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          {viewState !== "users" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={viewState === "conversation" ? handleBackToPartners : handleBackToUsers}
              className="shrink-0 h-8 w-8 sm:h-10 sm:w-10"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="h-5 w-5 sm:h-8 sm:w-8 text-primary shrink-0" />
              <span className="truncate">Chat Monitoring</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {viewState === "users" && "View and monitor all platform chats in real-time"}
              {viewState === "partners" && `Conversations for ${selectedUser?.username}`}
              {viewState === "conversation" && `${selectedUser?.username} ↔ ${selectedPartner?.username}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1 px-2 sm:px-3 py-1 text-xs w-fit shrink-0 bg-green-500/10 text-green-600 border-green-500/30"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </Badge>
          <Badge variant="outline" className="gap-1 px-2 sm:px-3 py-1 text-xs w-fit shrink-0">
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            Read-Only
          </Badge>
        </div>
      </div>

      {viewState === "users" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium truncate">Total Chats</CardTitle>
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats.totalChats}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium truncate">Active Users</CardTitle>
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.activeUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium truncate">Messages (24h)</CardTitle>
              <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats.messagesLast24h}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
              <CardTitle className="text-[10px] sm:text-sm font-medium truncate">Avg Response</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-lg sm:text-2xl font-bold">{stats.averageResponseTime}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card className="flex-1 overflow-hidden">
        {/* LEVEL 1: Users List */}
        {viewState === "users" && (
          <>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                    All Chat Users
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Click on a user to view their conversations
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {loading ? (
                <div className="space-y-3 p-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 sm:h-20 w-full" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No users found</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] sm:h-[500px]">
                  <div className="divide-y">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="flex items-center justify-between p-3 sm:p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                              <AvatarImage src={user.profileImage || "/placeholder.svg"} alt={user.username} />
                              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span
                              className={cn(
                                "absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-2 border-background",
                                user.isOnline ? "bg-green-500" : "bg-gray-400",
                              )}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm sm:text-base truncate">{user.username}</p>
                              <Badge
                                variant={getRoleBadgeVariant(user.role || "BUYER")}
                                className="text-[10px] sm:text-xs shrink-0"
                              >
                                {user.role || "User"}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs sm:text-sm font-medium">{user.totalChats} chats</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {user.lastActive 
                                ? formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })
                                : "Recently"}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </>
        )}

        {/* LEVEL 2: Chat Partners List */}
        {viewState === "partners" && selectedUser && (
          <>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                  <AvatarImage src={selectedUser.profileImage || "/placeholder.svg"} alt={selectedUser.username} />
                  <AvatarFallback>{selectedUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 flex-wrap text-base sm:text-lg">
                    <span className="truncate">{selectedUser.username}</span>
                    <Badge variant={getRoleBadgeVariant(selectedUser.role || "BUYER")} className="text-[10px] sm:text-xs shrink-0">
                      {selectedUser.role || "User"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {partners.length} conversation{partners.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {loading ? (
                <div className="space-y-3 p-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 sm:h-20 w-full" />
                  ))}
                </div>
              ) : partners.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No conversations found</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] sm:h-[500px]">
                  <div className="divide-y">
                    {partners.map((partner) => (
                      <div
                        key={partner.chatId}
                        onClick={() => handleSelectConversation(partner)}
                        className="flex items-center justify-between p-3 sm:p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                            <AvatarImage src={partner.profileImage || "/placeholder.svg"} alt={partner.username} />
                            <AvatarFallback>{partner.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm sm:text-base truncate">{partner.username}</p>
                              <Badge
                                variant={getRoleBadgeVariant(partner.role)}
                                className="text-[10px] sm:text-xs shrink-0"
                              >
                                {partner.role}
                              </Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1">
                              {partner.lastMessage?.includes("Voice") && <Mic className="h-3 w-3" />}
                              {partner.lastMessage}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                          <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                            {formatDistanceToNow(new Date(partner.lastMessageTime), { addSuffix: true })}
                          </p>
                          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </>
        )}

        {/* LEVEL 3: Conversation History */}
        {viewState === "conversation" && conversation && selectedUser && selectedPartner && (
          <>
            <CardHeader className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="flex -space-x-2 shrink-0">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-background">
                      <AvatarImage
                        src={conversation.participants.user1.profileImage || "/placeholder.svg"}
                        alt={conversation.participants.user1.username}
                      />
                      <AvatarFallback className="text-xs">
                        {conversation.participants.user1.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-background">
                      <AvatarImage
                        src={conversation.participants.user2.profileImage || "/placeholder.svg"}
                        alt={conversation.participants.user2.username}
                      />
                      <AvatarFallback className="text-xs">
                        {conversation.participants.user2.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm sm:text-lg truncate">
                      {conversation.participants.user1.username} ↔ {conversation.participants.user2.username}
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-sm">
                      {conversation.messages.length} messages
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs">
                    <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    {conversation.participants.user1.role}
                  </Badge>
                  <span className="text-muted-foreground text-xs">↔</span>
                  <Badge variant="outline" className="gap-1 text-[10px] sm:text-xs">
                    <User className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    {conversation.participants.user2.role}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[400px] sm:h-[500px]">
                  <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                    {conversation.messages.map((message, index) => {
                      const isUser1 = message.senderId === conversation.participants.user1.id
                      const sender = isUser1 ? conversation.participants.user1 : conversation.participants.user2

                      return (
                        <div
                          key={message.id || index}
                          className={`flex gap-2 sm:gap-3 ${isUser1 ? "" : "flex-row-reverse"}`}
                        >
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 shrink-0">
                            <AvatarImage src={sender.profileImage || "/placeholder.svg"} alt={sender.username} />
                            <AvatarFallback className="text-[10px] sm:text-xs">
                              {sender.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[75%] ${isUser1 ? "" : "text-right"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] sm:text-xs font-medium">{message.senderName}</span>
                              <span className="text-[10px] sm:text-xs text-muted-foreground">
                                {format(new Date(message.timestamp), "HH:mm")}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm inline-block",
                                isUser1 ? "bg-muted" : "bg-primary/10",
                              )}
                            >
                              {message.type === "voice" ? (
                                <span className="flex items-center gap-1">
                                  <Mic className="h-3 w-3" />
                                  Voice message ({message.voiceDuration}s)
                                </span>
                              ) : (
                                message.content
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
