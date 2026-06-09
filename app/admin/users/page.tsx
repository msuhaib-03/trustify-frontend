"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, MoreVertical, UserX, Shield, Eye, Mail, AlertTriangle, CheckCircle2, Star, UserCheck, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { adminAPI } from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"

interface RegisteredUser {
  id: string
  username: string
  email: string
  role: "USER" | "ADMIN"
  status: "ACTIVE" | "SUSPENDED"
  verified: boolean
  fraudScore: number
  trustRating: number
  createdAt: string
  lastActive: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<RegisteredUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null)
  const [activateUserId, setActivateUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      // Use centralized API - works with both mock and real backend
      const response = await adminAPI.getAllUsers()
      // Handle both paginated response and direct array response
      const usersData = response.data.content || response.data || []
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast.error("Failed to load users")
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuspendUser = async () => {
    if (!suspendUserId) return
    try {
      await adminAPI.suspendUser(suspendUserId)
      setUsers(users.map((u) => (u.id === suspendUserId ? { ...u, status: "SUSPENDED" } : u)))
      toast.success("User suspended successfully")
    } catch (error) {
      toast.error("Failed to suspend user")
    } finally {
      setSuspendUserId(null)
    }
  }

  const handleActivateUser = async () => {
    if (!activateUserId) return
    try {
      await adminAPI.activateUser(activateUserId)
      setUsers(users.map((u) => (u.id === activateUserId ? { ...u, status: "ACTIVE" } : u)))
      toast.success("User activated successfully")
    } catch (error) {
      toast.error("Failed to activate user")
    } finally {
      setActivateUserId(null)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getRiskBadge = (score: number) => {
    if (score < 30)
      return <Badge className="bg-green-500/10 text-green-500 text-[10px] sm:text-xs">Low Risk</Badge>
    if (score < 70) return <Badge className="bg-yellow-500/10 text-yellow-500 text-[10px] sm:text-xs">Medium</Badge>
    return <Badge className="bg-red-500/10 text-red-500 text-[10px] sm:text-xs">High Risk</Badge>
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch {
      return "-"
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage and monitor all platform users</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">All Users ({filteredUsers.length})</CardTitle>
          <CardDescription className="text-xs sm:text-sm">View and manage user accounts - synchronized with sign-ups</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No users found</p>
              <p className="text-sm mt-1">New users will appear here after signing up</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm sm:text-base truncate">{user.username}</p>
                        <Badge
                          variant={user.role === "ADMIN" ? "default" : "secondary"}
                          className="text-[10px] sm:text-xs shrink-0"
                        >
                          {user.role === "ADMIN" && <Shield className="h-2.5 w-2.5 mr-1" />}
                          {user.role}
                        </Badge>
                        {user.verified && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 border-green-500/30 text-green-500">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge
                          variant={user.status === "ACTIVE" ? "outline" : "destructive"}
                          className="text-[10px] sm:text-xs"
                        >
                          {user.status}
                        </Badge>
                        {getRiskBadge(user.fraudScore)}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          {user.trustRating.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Joined {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          View Risk Analysis
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.role !== "ADMIN" && (
                          user.status === "SUSPENDED" ? (
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => setActivateUserId(user.id)}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setSuspendUserId(user.id)}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          )
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={!!suspendUserId} onOpenChange={() => setSuspendUserId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend this user? They will not be able to access the platform until
              unsuspended.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendUser}
              className="bg-destructive text-destructive-foreground w-full sm:w-auto"
            >
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Confirmation Dialog */}
      <AlertDialog open={!!activateUserId} onOpenChange={() => setActivateUserId(null)}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Activate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate this user? They will regain full access to the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActivateUser}
              className="bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto"
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
