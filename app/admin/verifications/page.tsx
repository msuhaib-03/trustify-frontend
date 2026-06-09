"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Check,
  X,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { formatDistanceToNow, format, isValid } from "date-fns"

// Helper function to safely format dates
const safeFormatDate = (dateString: string | null | undefined, formatStr: string, fallback: string = "N/A"): string => {
  if (!dateString) return fallback
  try {
    const date = new Date(dateString)
    if (!isValid(date)) return fallback
    return format(date, formatStr)
  } catch {
    return fallback
  }
}

const safeFormatDistanceToNow = (dateString: string | null | undefined, fallback: string = ""): string => {
  if (!dateString) return fallback
  try {
    const date = new Date(dateString)
    if (!isValid(date)) return fallback
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return fallback
  }
}

interface UserVerification {
  verificationId: string
  id?: string
  extractedName: string
  extractedCnicNumber: string
  frontImageUrl: string
  backImageUrl: string
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED"
  submittedAt?: string
  reviewedAt?: string | null
  reviewedBy?: string | null
  adminRemarks?: string | null
  rejectionReason?: string | null
}

function AdminVerificationsContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [verifications, setVerifications] = useState<UserVerification[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stats, setStats] = useState({
    totalVerifications: 0,
    pendingVerifications: 0,
    verifiedUsers: 0,
    rejectedVerifications: 0,
  })

  // Modal state
  const [selectedVerification, setSelectedVerification] = useState<UserVerification | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [adminRemarks, setAdminRemarks] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  useEffect(() => {
    fetchVerifications()
    fetchStats()
  }, [statusFilter])

  const fetchVerifications = async () => {
    setIsLoading(true)
    try {
      // Use direct fetch with token from localStorage for reliable auth
      const token = localStorage.getItem("token")
      
      if (!token) {
        toast.error("Please login to access this page")
        setIsLoading(false)
        return
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/cnic/all`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const responseData = await response.json()
      let data = responseData.content || responseData || []
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        data = []
      }
      
      // Filter by status if not "all"
      if (statusFilter && statusFilter !== "all") {
        data = data.filter((v: UserVerification) => v.status === statusFilter)
      }
      setVerifications(data)
    } catch (error) {
      console.error("Failed to fetch verifications:", error)
      toast.error("Failed to load verifications")
      setVerifications([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Use direct fetch with token from localStorage for reliable auth
      const token = localStorage.getItem("token")
      
      if (!token) {
        return
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/cnic/all`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const responseData = await response.json()
      const allVerifications = responseData.content || responseData || []
      
      // Ensure it's an array
      if (!Array.isArray(allVerifications)) {
        return
      }
      
      const pending = allVerifications.filter((v: UserVerification) => v.status === "PENDING" || v.status === "UNDER_REVIEW").length
      const verified = allVerifications.filter((v: UserVerification) => v.status === "APPROVED").length
      const rejected = allVerifications.filter((v: UserVerification) => v.status === "REJECTED").length
      
      setStats({
        totalVerifications: allVerifications.length,
        pendingVerifications: pending,
        verifiedUsers: verified,
        rejectedVerifications: rejected,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleApprove = async (verificationId: string) => {
    setIsProcessing(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/cnic/${verificationId}/approve`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ remarks: adminRemarks || undefined }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      toast.success("Verification approved successfully!")

      // Update local state
      setVerifications((prev) =>
        prev.map((v) =>
          (v.verificationId || v.id) === verificationId
            ? { ...v, status: "APPROVED" }
            : v,
        ),
      )

      if ((selectedVerification?.verificationId || selectedVerification?.id) === verificationId) {
        setSelectedVerification(null)
      }

      setAdminRemarks("")
      fetchStats()
    } catch (error) {
      toast.error("Failed to approve verification")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectSubmit = async () => {
    if (!selectedVerification || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason")
      return
    }

    setIsProcessing(true)
    try {
      const token = localStorage.getItem("token")
      const verificationId = selectedVerification.verificationId || selectedVerification.id
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/cnic/${verificationId}/reject`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: rejectionReason.trim(),
            remarks: adminRemarks || undefined,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      toast.success("Verification rejected")

      // Update local state
      setVerifications((prev) =>
        prev.map((v) =>
          (v.verificationId || v.id) === (selectedVerification.verificationId || selectedVerification.id)
            ? { ...v, status: "REJECTED", rejectionReason: rejectionReason.trim() }
            : v,
        ),
      )

      setSelectedVerification(null)
      setShowRejectDialog(false)
      setRejectionReason("")
      setAdminRemarks("")
      fetchStats()
    } catch (error) {
      toast.error("Failed to reject verification")
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-600"
      case "UNDER_REVIEW":
        return "bg-blue-500/10 text-blue-600"
      case "APPROVED":
        return "bg-green-500/10 text-green-600"
      case "REJECTED":
        return "bg-red-500/10 text-red-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-3 w-3" />
      case "UNDER_REVIEW":
        return <Clock className="h-3 w-3" />
      case "APPROVED":
        return <Check className="h-3 w-3" />
      case "REJECTED":
        return <X className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  const filteredVerifications = verifications.filter((v) => {
    const matchesSearch =
      (v.extractedName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.extractedCnicNumber || "").includes(searchQuery)

    return matchesSearch
  })

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
            <span className="truncate">User Verifications</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Review and manage user identity verifications</p>
        </div>
        <Button
          onClick={() => {
            fetchVerifications()
            fetchStats()
          }}
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.totalVerifications}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.pendingVerifications}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Verified</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.verifiedUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Rejected</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.rejectedVerifications}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or CNIC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Verifications List */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">All Verifications</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Click to review details and take action</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {isLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 sm:h-20 w-full" />
              ))}
            </div>
          ) : filteredVerifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No verifications found</p>
              <p className="text-xs mt-2">User verification requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVerifications.map((verification, index) => (
                <motion.div
                  key={verification.verificationId || verification.id || index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedVerification(verification)}
                  className="p-3 sm:p-4 border rounded-lg space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{verification.extractedName || "Name not available"}</p>
                      <p className="text-xs text-muted-foreground">
                        CNIC: {verification.extractedCnicNumber || "N/A"}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(verification.status)} text-xs flex items-center gap-1`}>
                      {getStatusIcon(verification.status)}
                      {(verification.status || "PENDING").replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                    {verification.submittedAt && safeFormatDistanceToNow(verification.submittedAt) && (
                      <span className="ml-auto">
                        Submitted {safeFormatDistanceToNow(verification.submittedAt)}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Detail Modal */}
      <Dialog open={!!selectedVerification} onOpenChange={(open) => !open && setSelectedVerification(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8">Verification Details</DialogTitle>
            <DialogDescription>Review user documents and take action</DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{selectedVerification.extractedName || "Name not available"}</h3>
                  <p className="text-sm text-muted-foreground">
                    CNIC: {selectedVerification.extractedCnicNumber || "N/A"}
                  </p>
                </div>
                <Badge className={`${getStatusColor(selectedVerification.status)} flex items-center gap-1`}>
                  {getStatusIcon(selectedVerification.status)}
                  {(selectedVerification.status || "PENDING").replace("_", " ")}
                </Badge>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium">{selectedVerification.extractedName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CNIC Number</p>
                  <p className="text-sm font-medium">{selectedVerification.extractedCnicNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">{selectedVerification.status || "PENDING"}</p>
                </div>
                {selectedVerification.submittedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="text-sm font-medium">{safeFormatDate(selectedVerification.submittedAt, "PPpp")}</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Uploaded Documents</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">CNIC Front</p>
                    {selectedVerification.frontImageUrl ? (
                      <img
                        src={selectedVerification.frontImageUrl}
                        alt="CNIC Front"
                        className="w-full aspect-video object-contain border rounded-lg bg-muted"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg"
                        }}
                      />
                    ) : (
                      <div className="w-full aspect-video border rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                        No image available
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">CNIC Back</p>
                    {selectedVerification.backImageUrl ? (
                      <img
                        src={selectedVerification.backImageUrl}
                        alt="CNIC Back"
                        className="w-full aspect-video object-contain border rounded-lg bg-muted"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg"
                        }}
                      />
                    ) : (
                      <div className="w-full aspect-video border rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                        No image available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                {selectedVerification.submittedAt && safeFormatDate(selectedVerification.submittedAt, "PPpp") !== "N/A" && (
                  <p>Submitted: {safeFormatDate(selectedVerification.submittedAt, "PPpp")}</p>
                )}
                {selectedVerification.reviewedAt && safeFormatDate(selectedVerification.reviewedAt, "PPpp") !== "N/A" && (
                  <p>Reviewed: {safeFormatDate(selectedVerification.reviewedAt, "PPpp")}</p>
                )}
                {selectedVerification.reviewedBy && <p>Reviewed by: {selectedVerification.reviewedBy}</p>}
              </div>

              {/* Admin Remarks Input */}
              {(selectedVerification.status === "PENDING" || selectedVerification.status === "UNDER_REVIEW") && (
                <div className="space-y-2">
                  <Label htmlFor="adminRemarks">Admin Remarks (Optional)</Label>
                  <Textarea
                    id="adminRemarks"
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    placeholder="Add any remarks or notes..."
                    rows={3}
                  />
                </div>
              )}

              {/* Action Buttons */}
              {(selectedVerification.status === "PENDING" || selectedVerification.status === "UNDER_REVIEW") && (
                <div className="flex gap-2 pt-2 border-t flex-wrap">
                  <Button
                    onClick={() => handleApprove(selectedVerification.verificationId || selectedVerification.id || "")}
                    disabled={isProcessing}
                    className="flex-1 gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Approve Verification
                  </Button>
                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    disabled={isProcessing}
                    variant="destructive"
                    className="flex-1 gap-2"
                  >
                    <X className="h-4 w-4" />
                    Reject Verification
                  </Button>
                </div>
              )}

              {/* Rejection Details */}
              {selectedVerification.rejectionReason && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                  <p className="text-sm text-destructive/80 mt-1">{selectedVerification.rejectionReason}</p>
                  {selectedVerification.adminRemarks && (
                    <p className="text-xs text-muted-foreground mt-2">Admin: {selectedVerification.adminRemarks}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this verification</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">
                Rejection Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why the verification is being rejected..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowRejectDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleRejectSubmit}
                disabled={isProcessing || !rejectionReason.trim()}
                variant="destructive"
                className="flex-1"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminVerificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      }
    >
      <AdminVerificationsContent />
    </Suspense>
  )
}
