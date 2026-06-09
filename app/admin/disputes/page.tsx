"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { Scale, Search, Eye, RefreshCw, CheckCircle, XCircle, Clock, DollarSign, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { adminAPI, disputeAPI } from "@/lib/api"

interface Dispute {
  // Backend field names (MongoDB @Id is serialized as "id")
  id: string
  transactionId?: string
  openedBy?: string       // buyerId
  reason?: string
  evidence?: string       // description / message from buyer
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED"
  resolutionNote?: string
  decision?: string
  refundAmountCents?: number
  createdAt?: string
  updatedAt?: string
  resolvedAt?: string
  // Enriched fields (not on backend model — shown as fallbacks)
  buyerName?: string
  sellerName?: string
  listingTitle?: string
  amountCents?: number
}

function AdminDisputesContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [stats, setStats] = useState({
    totalDisputes: 0,
    openDisputes: 0,
    underReviewDisputes: 0,
    resolvedDisputes: 0,
    closedDisputes: 0,
    totalDisputedValue: 0,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [resolution, setResolution] = useState("")
  const [refundAmount, setRefundAmount] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchDisputes()
    fetchStats()
  }, [statusFilter])

  const fetchDisputes = async () => {
    setIsLoading(true)
    try {
      // Use admin API endpoint for disputes
      const response = await adminAPI.getAllDisputes({
        status: statusFilter !== "all" ? statusFilter : undefined,
      })
      // Handle both paginated response and direct array response
      const disputesData = response.data.content || response.data || []
      setDisputes(Array.isArray(disputesData) ? disputesData : [])
    } catch (error) {
      console.error("Failed to fetch disputes:", error)
      toast.error("Failed to load disputes")
      setDisputes([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Try to get stats from disputes endpoint, fallback to calculating from disputes
      try {
        const response = await disputeAPI.getStats()
        setStats(response.data)
      } catch {
        // If stats endpoint doesn't exist, calculate from disputes
        const response = await adminAPI.getAllDisputes()
        const allDisputes = response.data.content || response.data || []
        const open = allDisputes.filter((d: Dispute) => d.status === "OPEN").length
        const underReview = allDisputes.filter((d: Dispute) => d.status === "UNDER_REVIEW").length
        const resolved = allDisputes.filter((d: Dispute) => d.status === "RESOLVED").length
        const closed = allDisputes.filter((d: Dispute) => d.status === "CLOSED").length
        const totalValue = allDisputes.reduce((acc: number, d: Dispute) => acc + (d.amountCents || 0), 0)
        
        setStats({
          totalDisputes: allDisputes.length,
          openDisputes: open,
          underReviewDisputes: underReview,
          resolvedDisputes: resolved,
          closedDisputes: closed,
          totalDisputedValue: totalValue,
        })
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleResolveDispute = async (action: "refund_buyer" | "release_to_seller" | "partial_refund") => {
    if (!selectedDispute) return
    setActionLoading(true)
    try {
      const refundAmountCents = action === "partial_refund" ? Number.parseInt(refundAmount) * 100 : undefined

      await disputeAPI.resolve(selectedDispute.id, {
        action,
        resolution,
        refundAmountCents,
      })

      toast.success("Dispute resolved successfully")
      setSelectedDispute(null)
      setResolution("")
      setRefundAmount("")
      fetchDisputes()
      fetchStats()
    } catch (error) {
      toast.error("Failed to resolve dispute")
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (disputeId: string, status: Dispute["status"]) => { // disputeId = dispute.id
    try {
      // Use centralized API - works with both mock and real backend
      await disputeAPI.resolve(disputeId, {
        action: "update_status",
        resolution: `Status changed to ${status}`,
      })
      toast.success("Status updated successfully")
      fetchDisputes()
      fetchStats()
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
      case "UNDER_REVIEW":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20"
      case "RESOLVED":
        return "bg-green-500/10 text-green-600 border-green-500/20"
      case "CLOSED":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertTriangle className="h-3 w-3" />
      case "UNDER_REVIEW":
        return <Clock className="h-3 w-3" />
      case "RESOLVED":
        return <CheckCircle className="h-3 w-3" />
      case "CLOSED":
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const filteredDisputes = disputes.filter((dispute) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (dispute.disputeId?.toLowerCase().includes(q) ?? false) ||
      (dispute.buyerName?.toLowerCase().includes(q) ?? false) ||
      (dispute.sellerName?.toLowerCase().includes(q) ?? false) ||
      (dispute.reason?.toLowerCase().includes(q) ?? false) ||
      (dispute.listingTitle?.toLowerCase().includes(q) ?? false)
    return matchesSearch
  })

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Scale className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
            <span className="truncate">Dispute Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Review and resolve transaction disputes</p>
        </div>
        <Button
          onClick={() => {
            fetchDisputes()
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Open</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.openDisputes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Under Review</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.underReviewDisputes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Resolved</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.resolvedDisputes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Total Value</span>
            </div>
            <p className="text-sm sm:text-xl md:text-2xl font-bold truncate">
              ${(stats.totalDisputedValue / 100).toLocaleString()}
            </p>
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
                placeholder="Search disputes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Disputes List */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">All Disputes ({filteredDisputes.length})</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage and resolve transaction disputes from users
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {isLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 sm:h-20 w-full" />
              ))}
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center py-12">
              <Scale className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No disputes found</h3>
              <p className="text-sm text-muted-foreground">
                {statusFilter !== "all"
                  ? `No ${statusFilter.toLowerCase().replace("_", " ")} disputes at the moment.`
                  : "When users open disputes, they will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDisputes.map((dispute, index) => (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 sm:p-4 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs sm:text-sm text-muted-foreground">{dispute.id}</p>
                      <p className="text-sm sm:text-base font-medium truncate">{dispute.reason || "No reason provided"}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{dispute.listingTitle || "N/A"}</p>
                    </div>
                    <Badge className={`${getStatusColor(dispute.status)} text-[10px] sm:text-xs flex-shrink-0 gap-1`}>
                      {getStatusIcon(dispute.status)}
                      {dispute.status?.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div>
                      <span className="text-muted-foreground">Opened by: </span>
                      <span className="font-medium">{dispute.buyerName || dispute.openedBy || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Transaction: </span>
                      <span className="font-mono text-xs">{dispute.transactionId ? dispute.transactionId.slice(-8) : "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <p className="font-medium text-sm sm:text-base text-primary">
                      {dispute.amountCents ? `$${(dispute.amountCents / 100).toLocaleString()}` : "—"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {dispute.createdAt ? formatDistanceToNow(new Date(dispute.createdAt), { addSuffix: true }) : ""}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDispute(dispute)}
                        className="h-7 px-2 text-xs bg-transparent"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Review</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispute Resolution Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto mx-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Resolve Dispute</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Review the dispute details and take action
            </DialogDescription>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Dispute ID</p>
                  <p className="font-mono text-xs sm:text-sm break-all">{selectedDispute.id}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-xs sm:text-sm break-all">{selectedDispute.transactionId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium text-sm">
                    {selectedDispute.amountCents ? `$${(selectedDispute.amountCents / 100).toLocaleString()}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                  <Badge className={`${getStatusColor(selectedDispute.status)} text-xs`}>
                    {selectedDispute.status?.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Opened By</p>
                  <p className="text-sm font-medium">{selectedDispute.buyerName || selectedDispute.openedBy || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Seller</p>
                  <p className="text-sm font-medium">{selectedDispute.sellerName || "N/A"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Listing</p>
                <p className="font-medium text-sm">{selectedDispute.listingTitle || "N/A"}</p>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Reason</p>
                <p className="font-medium text-sm">{selectedDispute.reason || "Not specified"}</p>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Evidence / Message</p>
                <p className="p-2 sm:p-3 bg-muted/50 rounded-lg text-xs sm:text-sm">
                  {selectedDispute.evidence || "No additional evidence provided."}
                </p>
              </div>

              {selectedDispute.resolutionNote && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Resolution</p>
                  <p className="p-2 sm:p-3 bg-green-500/10 rounded-lg text-xs sm:text-sm text-green-700">
                    {selectedDispute.resolutionNote}
                  </p>
                </div>
              )}

              {(selectedDispute.status === "OPEN" || selectedDispute.status === "UNDER_REVIEW") && (
                <>
                  {selectedDispute.status === "OPEN" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedDispute.id, "UNDER_REVIEW")}
                      className="w-full bg-transparent"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Mark as Under Review
                    </Button>
                  )}

                  <div>
                    <Label className="text-xs sm:text-sm">Resolution Notes</Label>
                    <Textarea
                      placeholder="Add notes about the resolution..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="text-sm mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs sm:text-sm">Partial Refund Amount ($)</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount for partial refund"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="text-sm mt-1"
                    />
                  </div>

                  <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResolveDispute("release_to_seller")}
                      disabled={actionLoading}
                      className="bg-transparent w-full sm:w-auto"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Release to Seller
                    </Button>
                    {refundAmount && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveDispute("partial_refund")}
                        disabled={actionLoading}
                        className="bg-transparent w-full sm:w-auto"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Partial Refund
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleResolveDispute("refund_buyer")}
                      disabled={actionLoading}
                      className="w-full sm:w-auto"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Full Refund to Buyer
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminDisputesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      }
    >
      <AdminDisputesContent />
    </Suspense>
  )
}
