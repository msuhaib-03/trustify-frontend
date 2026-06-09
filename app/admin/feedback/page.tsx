"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { MessageSquareText, Star, Search, Filter, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { feedbackAPI } from "@/lib/api"
import { formatDistanceToNow, format } from "date-fns"

interface Feedback {
  feedbackId: string
  userId: string
  userName: string
  userEmail: string
  feedbackType: "BUG_REPORT" | "FEATURE_REQUEST" | "PAYMENT_ISSUE" | "CHAT_ISSUE" | "OTHER"
  title: string
  message: string
  rating?: number
  status: "NEW" | "REVIEWED" | "RESOLVED"
  createdAt: string
  updatedAt: string
}

const feedbackTypes = [
  { value: "BUG_REPORT", label: "Bug Report" },
  { value: "FEATURE_REQUEST", label: "Feature Request" },
  { value: "PAYMENT_ISSUE", label: "Payment Issue" },
  { value: "CHAT_ISSUE", label: "Chat Issue" },
  { value: "OTHER", label: "Other" },
]

function AdminFeedbackContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    totalFeedback: 0,
    newFeedback: 0,
    reviewedFeedback: 0,
    resolvedFeedback: 0,
    averageRating: 0,
  })

  // Modal state
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  useEffect(() => {
    fetchFeedback()
    fetchStats()
  }, [page, statusFilter])

  const fetchFeedback = async () => {
    setIsLoading(true)
    try {
      const response = await feedbackAPI.getAll({
        page,
        size: 10,
        status: statusFilter,
      })
      setFeedbackList(response.data.content || [])
      setTotalPages(response.data.totalPages || 1)
    } catch (error) {
      console.error("Failed to fetch feedback:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await feedbackAPI.getStats()
      setStats(response.data)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const handleStatusUpdate = async (feedbackId: string, newStatus: Feedback["status"]) => {
    setIsUpdatingStatus(true)
    try {
      await feedbackAPI.updateStatus(feedbackId, newStatus)
      toast.success(`Status updated to ${newStatus}`)

      // Update local state
      setFeedbackList((prev) => prev.map((f) => (f.feedbackId === feedbackId ? { ...f, status: newStatus } : f)))

      if (selectedFeedback?.feedbackId === feedbackId) {
        setSelectedFeedback((prev) => (prev ? { ...prev, status: newStatus } : null))
      }

      fetchStats()
    } catch (error) {
      toast.error("Failed to update status")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-500/10 text-blue-600"
      case "REVIEWED":
        return "bg-yellow-500/10 text-yellow-600"
      case "RESOLVED":
        return "bg-green-500/10 text-green-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "NEW":
        return <AlertCircle className="h-3 w-3" />
      case "REVIEWED":
        return <Clock className="h-3 w-3" />
      case "RESOLVED":
        return <CheckCircle2 className="h-3 w-3" />
      default:
        return null
    }
  }

  const getTypeLabel = (type: string) => {
    return feedbackTypes.find((t) => t.value === type)?.label || type
  }

  const filteredFeedback = feedbackList.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.message.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
            <span className="truncate">Users Feedback</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage and respond to user feedback</p>
        </div>
        <Button
          onClick={() => {
            fetchFeedback()
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <MessageSquareText className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.totalFeedback}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">New</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.newFeedback}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Reviewed</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.reviewedFeedback}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Resolved</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.resolvedFeedback}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Avg Rating</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
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
                placeholder="Search feedback..."
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
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="REVIEWED">Reviewed</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">All Feedback</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Click to view details and update status</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {isLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 sm:h-20 w-full" />
              ))}
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquareText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No feedback found</p>
              <p className="text-xs mt-2">User feedback will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedback.map((feedback, index) => (
                <motion.div
                  key={feedback.feedbackId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedFeedback(feedback)}
                  className="p-3 sm:p-4 border rounded-lg space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{feedback.title}</p>
                      <p className="text-xs text-muted-foreground">by {feedback.userName}</p>
                    </div>
                    <Badge className={`${getStatusColor(feedback.status)} text-xs flex items-center gap-1`}>
                      {getStatusIcon(feedback.status)}
                      {feedback.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(feedback.feedbackType)}
                    </Badge>
                    {feedback.rating && (
                      <div className="flex items-center gap-0.5">
                        {[...Array(feedback.rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
            Previous
          </Button>
          <span className="flex items-center px-2 sm:px-4 text-xs sm:text-sm">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      )}

      {/* Feedback Detail Modal */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8">Feedback Details</DialogTitle>
            <DialogDescription>Review and update feedback status</DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{selectedFeedback.title}</h3>
                  <p className="text-sm text-muted-foreground">by {selectedFeedback.userName}</p>
                </div>
                <Badge className={`${getStatusColor(selectedFeedback.status)} flex items-center gap-1`}>
                  {getStatusIcon(selectedFeedback.status)}
                  {selectedFeedback.status}
                </Badge>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline">{getTypeLabel(selectedFeedback.feedbackType)}</Badge>
                {selectedFeedback.rating && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < selectedFeedback.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Message</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                  {selectedFeedback.message}
                </p>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Submitted: {format(new Date(selectedFeedback.createdAt), "PPpp")}</p>
                {selectedFeedback.updatedAt !== selectedFeedback.createdAt && (
                  <p>Updated: {format(new Date(selectedFeedback.updatedAt), "PPpp")}</p>
                )}
              </div>

              {/* Status Update */}
              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-sm font-medium">Update Status</h4>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={selectedFeedback.status === "NEW" ? "default" : "outline"}
                    onClick={() => handleStatusUpdate(selectedFeedback.feedbackId, "NEW")}
                    disabled={isUpdatingStatus || selectedFeedback.status === "NEW"}
                    className="gap-1"
                  >
                    <AlertCircle className="h-3 w-3" />
                    New
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedFeedback.status === "REVIEWED" ? "default" : "outline"}
                    onClick={() => handleStatusUpdate(selectedFeedback.feedbackId, "REVIEWED")}
                    disabled={isUpdatingStatus || selectedFeedback.status === "REVIEWED"}
                    className="gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    Reviewed
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedFeedback.status === "RESOLVED" ? "default" : "outline"}
                    onClick={() => handleStatusUpdate(selectedFeedback.feedbackId, "RESOLVED")}
                    disabled={isUpdatingStatus || selectedFeedback.status === "RESOLVED"}
                    className="gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Resolved
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminFeedbackPage() {
  return (
    <Suspense fallback={null}>
      <AdminFeedbackContent />
    </Suspense>
  )
}
