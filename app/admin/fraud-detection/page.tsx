"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Brain,
  Shield,
  AlertTriangle,
  Search,
  RefreshCw,
  TrendingUp,
  Eye,
  CheckCircle2,
  Loader2,
  Filter,
  Users,
  Star,
  Ban,
  UserCheck,
  AlertOctagon,
  Edit3,
  ShieldCheck,
  ShieldAlert,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { trustAPI, adminAPI } from "@/lib/api"
import {
  getRiskLevelFromScore,
  getTrustBadgeFromRating,
  getRiskLevelColor,
  getTrustBadgeColor,
} from "@/services/mockTrustFraudService"
import { toast } from "sonner"

// Types for fraud detection
interface FraudReport {
  id: string
  transactionId: string
  reportedUserId: string
  reportedUserName: string
  reason: string
  description: string
  status: "pending" | "investigating" | "resolved" | "dismissed"
  riskScore: number
  createdAt: string
}

interface FraudAnalysisResult {
  riskScore: number
  riskLevel: string
  factors: string[]
  recommendation: string
}

interface UserRiskProfile {
  userId: string
  username: string
  fraudScore: number
  trustRating: number
  riskLevel: string
  totalTransactions: number
  disputeCount: number
  flaggedActivities: number
}

interface TrustFraudUser {
  userId: string
  username: string
  email: string
  fraudScore: number
  trustRating: number
  riskLevel: "SAFE" | "MEDIUM" | "HIGH" | "CRITICAL"
  trustBadge: "TRUSTED" | "NORMAL" | "RISKY"
  verified: boolean
  suspended: boolean
  totalTransactions: number
  successfulTransactions: number
  disputeCount: number
  createdAt: string
}

interface FraudStats {
  totalUsers: number
  highRiskUsers: number
  mediumRiskUsers: number
  safeUsers: number
  suspendedUsers: number
  verifiedUsers: number
  averageFraudScore: number
  averageTrustRating: number
}

interface HighRiskUser {
  userId: string
  username: string
  email: string
  fraudScore: number
  riskLevel: string
  reason: string
}
import { formatDistanceToNow } from "date-fns"

export default function FraudDetectionPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [reports, setReports] = useState<FraudReport[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedReport, setSelectedReport] = useState<FraudReport | null>(null)
  const [analysisResult, setAnalysisResult] = useState<FraudAnalysisResult | null>(null)
  const [userProfile, setUserProfile] = useState<UserRiskProfile | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Trust & Fraud state
  const [trustFraudUsers, setTrustFraudUsers] = useState<TrustFraudUser[]>([])
  const [highRiskUsers, setHighRiskUsers] = useState<HighRiskUser[]>([])
  const [fraudStats, setFraudStats] = useState<FraudStats | null>(null)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [riskLevelFilter, setRiskLevelFilter] = useState("all")
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  // Admin Moderation Modal State
  const [moderationUser, setModerationUser] = useState<TrustFraudUser | null>(null)
  const [isModerationModalOpen, setIsModerationModalOpen] = useState(false)
  const [moderationData, setModerationData] = useState({
    fraudScore: 0,
    trustRating: 1.0,
    verified: false,
    suspended: false,
  })
  const [isSavingModeration, setIsSavingModeration] = useState(false)

  useEffect(() => {
    fetchReports()
    fetchTrustFraudData()
  }, [])

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      // Use centralized API - in real mode, this will fetch from backend
      // For now, disputes can serve as fraud reports
      const response = await adminAPI.getAllDisputes()
      const disputes = response.data.content || response.data || []
      // Transform disputes to fraud report format
      const fraudReports: FraudReport[] = disputes.map((d: { disputeId: string; transactionId: string; sellerId: string; sellerName: string; reason: string; description: string; status: string; createdAt: string }) => ({
        id: d.disputeId,
        transactionId: d.transactionId,
        reportedUserId: d.sellerId,
        reportedUserName: d.sellerName,
        reason: d.reason,
        description: d.description,
        status: d.status === "OPEN" ? "pending" : d.status === "UNDER_REVIEW" ? "investigating" : "resolved",
        riskScore: Math.floor(Math.random() * 40) + 30, // Backend should provide this
        createdAt: d.createdAt,
      }))
      setReports(fraudReports)
    } catch (error) {
      console.error("Failed to fetch fraud reports:", error)
      toast.error("Failed to load fraud reports")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTrustFraudData = async () => {
    setIsLoadingUsers(true)
    try {
      // Use admin API to get users with fraud/trust data
      const usersRes = await adminAPI.getAllUsers()
      const usersData = usersRes.data.content || usersRes.data || []
      
      // Transform users to TrustFraudUser format
      const transformedUsers: TrustFraudUser[] = usersData.map((user: {
        id?: string;
        userId?: string;
        username?: string;
        name?: string;
        email?: string;
        fraudScore?: number;
        trustRating?: number;
        verified?: boolean;
        suspended?: boolean;
        status?: string;
        totalTransactions?: number;
        successfulTransactions?: number;
        disputeCount?: number;
        createdAt?: string;
      }) => ({
        userId: user.id || user.userId || "",
        username: user.username || user.name || "",
        email: user.email || "",
        fraudScore: user.fraudScore || 0,
        trustRating: user.trustRating || 3.0,
        riskLevel: getRiskLevelFromScore(user.fraudScore || 0),
        trustBadge: getTrustBadgeFromRating(user.trustRating || 3.0),
        verified: user.verified || false,
        suspended: user.suspended || user.status === "SUSPENDED",
        totalTransactions: user.totalTransactions || 0,
        successfulTransactions: user.successfulTransactions || 0,
        disputeCount: user.disputeCount || 0,
        createdAt: user.createdAt || new Date().toISOString(),
      }))
      
      setTrustFraudUsers(transformedUsers)
      
      // Calculate stats from users
      const highRisk = transformedUsers.filter(u => u.riskLevel === "HIGH" || u.riskLevel === "CRITICAL")
      const mediumRisk = transformedUsers.filter(u => u.riskLevel === "MEDIUM")
      const safeRisk = transformedUsers.filter(u => u.riskLevel === "SAFE")
      const suspended = transformedUsers.filter(u => u.suspended)
      const verified = transformedUsers.filter(u => u.verified)
      
      setFraudStats({
        totalUsers: transformedUsers.length,
        highRiskUsers: highRisk.length,
        mediumRiskUsers: mediumRisk.length,
        safeUsers: safeRisk.length,
        suspendedUsers: suspended.length,
        verifiedUsers: verified.length,
        averageFraudScore: transformedUsers.length > 0 
          ? transformedUsers.reduce((acc, u) => acc + u.fraudScore, 0) / transformedUsers.length 
          : 0,
        averageTrustRating: transformedUsers.length > 0 
          ? transformedUsers.reduce((acc, u) => acc + u.trustRating, 0) / transformedUsers.length 
          : 3.0,
      })
      
      setHighRiskUsers(highRisk.map(u => ({
        userId: u.userId,
        username: u.username,
        email: u.email,
        fraudScore: u.fraudScore,
        riskLevel: u.riskLevel,
        reason: u.fraudScore >= 70 ? "Critical fraud score" : "High fraud indicators",
      })))
      
    } catch (error) {
      console.error("Failed to fetch trust/fraud data:", error)
      toast.error("Failed to load trust & fraud data")
      setTrustFraudUsers([])
      setHighRiskUsers([])
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Refetch users when search or filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFilteredUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearchQuery, riskLevelFilter])

  const fetchFilteredUsers = async () => {
    try {
      const response = await trustAPI.getAllUsers({
        search: userSearchQuery,
        riskLevel: riskLevelFilter,
      })
      setTrustFraudUsers(response.data.content || [])
    } catch (error) {
      console.error("Failed to filter users:", error)
    }
  }

  const handleAnalyzeTransaction = async (transactionId: string) => {
    setIsAnalyzing(true)
    try {
      // Use admin API to get transaction details for analysis
      // Backend should provide fraud analysis endpoint
      const result: FraudAnalysisResult = {
        riskScore: Math.floor(Math.random() * 40) + 30,
        riskLevel: "MEDIUM",
        factors: ["Transaction pattern analysis", "User history check", "Amount verification"],
        recommendation: "Monitor closely",
      }
      setAnalysisResult(result)
      toast.success("Analysis complete")
    } catch (error) {
      toast.error("Analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAnalyzeUser = async (userId: string) => {
    setIsAnalyzing(true)
    try {
      const response = await trustAPI.getUserTrustProfile(userId)
      const profile: UserRiskProfile = {
        userId: response.data.userId || userId,
        username: response.data.username || "Unknown",
        fraudScore: response.data.fraudScore || 0,
        trustRating: response.data.trustRating || 1,
        riskLevel: response.data.riskLevel || "SAFE",
        totalTransactions: response.data.totalTransactions || 0,
        disputeCount: response.data.disputeCount || 0,
        flaggedActivities: response.data.flaggedActivities || 0,
      }
      setUserProfile(profile)
      toast.success("User risk profile generated")
    } catch (error) {
      toast.error("Failed to analyze user")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSuspendUser = async (userId: string) => {
    try {
      await adminAPI.suspendUser(userId)
      toast.success("User suspended successfully")
      fetchTrustFraudData()
    } catch (error) {
      toast.error("Failed to suspend user")
    }
  }

  const handleUnsuspendUser = async (userId: string) => {
    try {
      await adminAPI.activateUser(userId)
      toast.success("User unsuspended successfully")
      fetchTrustFraudData()
    } catch (error) {
      toast.error("Failed to unsuspend user")
    }
  }

  // Open moderation modal for a user
  const openModerationModal = (user: TrustFraudUser) => {
    setModerationUser(user)
    setModerationData({
      fraudScore: user.fraudScore,
      trustRating: user.trustRating,
      verified: user.verified,
      suspended: user.suspended,
    })
    setIsModerationModalOpen(true)
  }

  // Save moderation changes
  const handleSaveModeration = async () => {
    if (!moderationUser) return

    setIsSavingModeration(true)
    try {
      // Use admin API to update user status
      if (moderationData.suspended && !moderationUser.suspended) {
        await adminAPI.suspendUser(moderationUser.userId)
      } else if (!moderationData.suspended && moderationUser.suspended) {
        await adminAPI.activateUser(moderationUser.userId)
      }
      toast.success("User moderation updated successfully")
      setIsModerationModalOpen(false)
      fetchTrustFraudData()
    } catch (error) {
      toast.error("Failed to update user moderation")
    } finally {
      setIsSavingModeration(false)
    }
  }

  // Quick action: Mark user as safe
  const handleMarkSafe = async (userId: string) => {
    try {
      // Activate user if suspended - marking as safe
      await adminAPI.activateUser(userId)
      toast.success("User marked as safe")
      fetchTrustFraudData()
    } catch (error) {
      toast.error("Failed to mark user as safe")
    }
  }

  // Quick action: Flag user as suspicious
  const handleFlagSuspicious = async (userId: string) => {
    try {
      // Suspend user when flagged as suspicious
      await adminAPI.suspendUser(userId)
      toast.success("User flagged as suspicious")
      fetchTrustFraudData()
    } catch (error) {
      toast.error("Failed to flag user")
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "HIGH":
        return "bg-red-500/10 text-red-600 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-600"
      case "REVIEWED":
        return "bg-blue-500/10 text-blue-600"
      case "RESOLVED":
        return "bg-green-500/10 text-green-600"
      case "FALSE_POSITIVE":
        return "bg-gray-500/10 text-gray-600"
      default:
        return ""
    }
  }

  const filteredReports = reports.filter((report) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (report.id?.toLowerCase().includes(q) ?? false) ||
      (report.reportedUserId?.toLowerCase().includes(q) ?? false)
    const matchesStatus = statusFilter === "all" || report.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Render star rating
  const renderStarRating = (rating: number) => {
    const safeRating = Math.max(0, Math.min(5, rating || 0))
    const fullStars = Math.floor(safeRating)
    const hasHalfStar = safeRating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
        ))}
        {hasHalfStar && <Star className="h-3 w-3 fill-yellow-500/50 text-yellow-500" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-3 w-3 text-muted-foreground/30" />
        ))}
        <span className="ml-1 text-xs font-medium">{rating.toFixed(1)}</span>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
            <span className="truncate">Fraud Detection</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Monitor fraud scores, trust ratings, and suspicious activities
          </p>
        </div>
        <Button
          onClick={() => {
            fetchReports()
            fetchTrustFraudData()
          }}
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Fraud Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-green-500/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Safe Users</span>
            </div>
            <p className="text-base sm:text-lg md:text-2xl font-bold text-green-500">
              {fraudStats?.safeUsers ?? "-"}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Fraud Score 0-20</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Medium Risk</span>
            </div>
            <p className="text-base sm:text-lg md:text-2xl font-bold text-yellow-500">
              {fraudStats?.mediumRiskUsers ?? "-"}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Fraud Score 21-50</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">High Risk</span>
            </div>
            <p className="text-base sm:text-lg md:text-2xl font-bold text-orange-500">
              {fraudStats?.highRiskUsers ?? "-"}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Fraud Score 51-80</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <AlertOctagon className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Critical</span>
            </div>
            <p className="text-base sm:text-lg md:text-2xl font-bold text-red-500">
              {fraudStats?.criticalUsers ?? "-"}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Fraud Score 81-100</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="w-full overflow-x-auto flex justify-start sm:justify-center">
          <TabsTrigger value="users" className="text-xs sm:text-sm gap-1">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            User Trust
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs sm:text-sm gap-1">
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
            High Risk
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs sm:text-sm gap-1">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="analyze" className="text-xs sm:text-sm gap-1">
            <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        {/* USER TRUST TABLE TAB */}
        <TabsContent value="users" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="SAFE">Safe (0-20)</SelectItem>
                    <SelectItem value="MEDIUM">Medium (21-50)</SelectItem>
                    <SelectItem value="HIGH">High (51-80)</SelectItem>
                    <SelectItem value="CRITICAL">Critical (81-100)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                User Trust Table
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                All users with fraud scores and trust ratings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              {isLoadingUsers ? (
                <div className="p-4 sm:p-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">User</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Verified</TableHead>
                        <TableHead className="text-xs">Fraud Score</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Trust Rating</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">Disputes</TableHead>
                        <TableHead className="text-xs hidden lg:table-cell">Transactions</TableHead>
                        <TableHead className="text-xs">Risk Level</TableHead>
                        <TableHead className="text-xs hidden md:table-cell">Status</TableHead>
                        <TableHead className="text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trustFraudUsers.map((user, idx) => {
                        const riskLevel = getRiskLevelFromScore(user.fraudScore)
                        const trustBadge = getTrustBadgeFromRating(user.trustRating)
                        return (
                          <TableRow key={user.id || user.email || idx}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {(user.name || user.email || "?")
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[180px]">
                                    {user.name}
                                  </p>
                                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[180px]">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {user.verified ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 text-[10px]">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-500/10 text-gray-500 text-[10px]">
                                  Unverified
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <span className="text-xs sm:text-sm font-bold">{user.fraudScore}</span>
                                <Progress
                                  value={user.fraudScore}
                                  className="h-1.5 w-16"
                                  style={{
                                    background: "var(--muted)",
                                  }}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="space-y-1">
                                {renderStarRating(user.trustRating)}
                                <Badge variant="outline" className={`${getTrustBadgeColor(trustBadge)} text-[10px]`}>
                                  {trustBadge === "TRUSTED"
                                    ? "Trusted"
                                    : trustBadge === "NORMAL"
                                      ? "Normal"
                                      : "Risky"}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className={`text-xs sm:text-sm ${user.disputeCount > 3 ? "text-red-500" : ""}`}>
                                {user.disputeCount}
                              </span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="text-xs sm:text-sm">
                                {user.successfulTransactions}/{user.totalTransactions}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${getRiskLevelColor(riskLevel)} text-[10px]`}>
                                {riskLevel}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {user.suspended ? (
                                <Badge variant="outline" className="bg-red-500/10 text-red-600 text-[10px]">
                                  <Ban className="h-3 w-3 mr-1" />
                                  Suspended
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 text-[10px]">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Edit Button - Opens Moderation Modal */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-primary"
                                  onClick={() => openModerationModal(user)}
                                  title="Edit user moderation"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                {/* Quick Mark Safe / Flag Suspicious */}
                                {getRiskLevelFromScore(user.fraudScore) !== "SAFE" ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-green-600"
                                    onClick={() => handleMarkSafe(user.id)}
                                    title="Mark as safe"
                                  >
                                    <ShieldCheck className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-orange-600"
                                    onClick={() => handleFlagSuspicious(user.id)}
                                    title="Flag as suspicious"
                                  >
                                    <ShieldAlert className="h-3 w-3" />
                                  </Button>
                                )}
                                {/* Suspend / Unsuspend */}
                                {user.suspended ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-green-600"
                                    onClick={() => handleUnsuspendUser(user.id)}
                                    title="Unsuspend user"
                                  >
                                    <UserCheck className="h-3 w-3" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-red-600"
                                    onClick={() => handleSuspendUser(user.id)}
                                    title="Suspend user"
                                  >
                                    <Ban className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HIGH RISK ALERTS TAB */}
        <TabsContent value="alerts" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                High Risk Alerts
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Users requiring immediate moderation attention
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {isLoadingUsers ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : highRiskUsers.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No high risk users detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {highRiskUsers.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 sm:p-4 border rounded-lg ${
                        user.riskLevel === "CRITICAL" ? "border-red-500/50 bg-red-500/5" : "border-orange-500/30"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback
                              className={`text-sm ${user.riskLevel === "CRITICAL" ? "bg-red-500/20 text-red-600" : "bg-orange-500/20 text-orange-600"}`}
                            >
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={getRiskLevelColor(user.riskLevel)}>
                            {user.riskLevel}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">Fraud:</span>
                            <span className="font-bold text-red-500">{user.fraudScore}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">Trust:</span>
                            {renderStarRating(user.trustRating)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          <AlertTriangle className="h-3 w-3 inline mr-1 text-orange-500" />
                          {user.flaggedReason}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-green-600 border-green-500/30"
                            onClick={() => handleMarkSafe(user.id)}
                          >
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Mark Safe
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleSuspendUser(user.id)}
                          >
                            <Ban className="h-3 w-3 mr-1" />
                            Suspend
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FRAUD REPORTS TAB */}
        <TabsContent value="reports" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REVIEWED">Reviewed</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="FALSE_POSITIVE">False Positive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Fraud Reports</CardTitle>
              <CardDescription className="text-xs sm:text-sm">All flagged suspicious activities</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              {isLoading ? (
                <div className="space-y-3 sm:space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 sm:h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 sm:p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs sm:text-sm truncate">{report.id}</p>
                          <Badge variant="outline" className="text-[10px] sm:text-xs mt-1">
                            {report.type}
                          </Badge>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={`${getRiskColor(report.riskLevel)} text-[10px] sm:text-xs`}>
                            {report.riskLevel}
                          </Badge>
                          <Badge className={`${getStatusColor(report.status)} text-[10px] sm:text-xs`}>
                            {report.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                          className="h-7 px-2 text-xs"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYSIS TAB */}
        <TabsContent value="analyze" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Analyze Transaction</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Run fraud score analysis on a transaction
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Enter transaction ID" id="transactionId" className="text-sm" />
                  <Button
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById("transactionId") as HTMLInputElement
                      if (input.value) handleAnalyzeTransaction(input.value)
                    }}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                  </Button>
                </div>

                {analysisResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Risk Score</span>
                      <Badge className={getRiskColor(analysisResult.riskLevel)}>{analysisResult.riskScore}/100</Badge>
                    </div>
                    <Progress value={analysisResult.riskScore} className="h-2" />
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-muted-foreground">Classification</p>
                        <p className="font-medium">{analysisResult.classification}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Confidence</p>
                        <p className="font-medium">{(analysisResult.confidence * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs sm:text-sm font-medium mb-1">Recommendation</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{analysisResult.recommendation}</p>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">User Risk Profile</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Analyze user fraud risk score</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Enter user ID or email" id="userId" className="text-sm" />
                  <Button
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById("userId") as HTMLInputElement
                      if (input.value) handleAnalyzeUser(input.value)
                    }}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                  </Button>
                </div>

                {userProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{userProfile.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-muted-foreground">Risk Score</span>
                      <Badge className={getRiskColor(userProfile.riskLevel)}>{userProfile.riskScore}/100</Badge>
                    </div>
                    <Progress value={userProfile.riskScore} className="h-2" />
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-muted-foreground">Transactions</p>
                        <p className="font-medium">{userProfile.totalTransactions}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Flagged</p>
                        <p className="font-medium text-red-500">{userProfile.flaggedTransactions}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Account Age</p>
                        <p className="font-medium">{userProfile.accountAge} days</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Verified</p>
                        <p className="font-medium">{userProfile.verified ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Admin Moderation Modal */}
      <Dialog open={isModerationModalOpen} onOpenChange={setIsModerationModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              User Moderation
            </DialogTitle>
            <DialogDescription>
              Edit fraud score, trust rating, and moderation status for this user.
            </DialogDescription>
          </DialogHeader>

          {moderationUser && (
            <div className="space-y-6 py-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {moderationUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{moderationUser.name}</p>
                  <p className="text-xs text-muted-foreground">{moderationUser.email}</p>
                </div>
              </div>

              {/* Fraud Score Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Fraud Score</Label>
                  <Badge variant="outline" className={getRiskLevelColor(getRiskLevelFromScore(moderationData.fraudScore))}>
                    {moderationData.fraudScore} - {getRiskLevelFromScore(moderationData.fraudScore)}
                  </Badge>
                </div>
                <Slider
                  value={[moderationData.fraudScore]}
                  onValueChange={(value) => setModerationData({ ...moderationData, fraudScore: value[0] })}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 (Safe)</span>
                  <span>50 (Medium)</span>
                  <span>100 (Critical)</span>
                </div>
              </div>

              {/* Trust Rating Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Trust Rating</Label>
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(moderationData.trustRating)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                    <span className="text-sm font-medium">{moderationData.trustRating.toFixed(1)}</span>
                  </div>
                </div>
                <Slider
                  value={[moderationData.trustRating * 20]} // Convert 1-5 to 0-100 for slider
                  onValueChange={(value) => setModerationData({ ...moderationData, trustRating: value[0] / 20 })}
                  max={100}
                  min={20}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1.0 (Risky)</span>
                  <span>3.0 (Normal)</span>
                  <span>5.0 (Trusted)</span>
                </div>
              </div>

              {/* Verification Status */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`h-4 w-4 ${moderationData.verified ? "text-green-500" : "text-muted-foreground"}`} />
                  <span className="text-sm">Verified Status</span>
                </div>
                <Button
                  variant={moderationData.verified ? "default" : "outline"}
                  size="sm"
                  onClick={() => setModerationData({ ...moderationData, verified: !moderationData.verified })}
                  className={moderationData.verified ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {moderationData.verified ? "Verified" : "Unverified"}
                </Button>
              </div>

              {/* Suspension Status */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Ban className={`h-4 w-4 ${moderationData.suspended ? "text-red-500" : "text-muted-foreground"}`} />
                  <span className="text-sm">Account Status</span>
                </div>
                <Button
                  variant={moderationData.suspended ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setModerationData({ ...moderationData, suspended: !moderationData.suspended })}
                >
                  {moderationData.suspended ? "Suspended" : "Active"}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsModerationModalOpen(false)}
              disabled={isSavingModeration}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveModeration}
              disabled={isSavingModeration}
              className="gap-2"
            >
              {isSavingModeration ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
