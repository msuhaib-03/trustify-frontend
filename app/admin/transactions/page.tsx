"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CreditCard, Search, Filter, Eye, RefreshCw, DollarSign, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { transactionAPI } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Transaction {
  id: string
  amountCents?: number
  amount?: number
  status: string
  buyerId?: string
  buyerName?: string
  sellerId?: string
  sellerName?: string
  buyer?: { id: string; username: string }
  seller?: { id: string; username: string }
  listing?: { id: string; title: string }
  type?: "SALE" | "RENT"
  createdAt: string
}

export default function AdminTransactionsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    totalVolume: 0,
    pendingCount: 0,
    completedCount: 0,
    disputedCount: 0,
  })

  useEffect(() => {
    fetchTransactions()
    fetchStats()
  }, [page, statusFilter])

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      console.log("[Admin Transactions] Fetching transactions from shared service")
      const response = await transactionAPI.getAdminTransactions({ page, size: 10 })
      console.log("[Admin Transactions] Received transactions:", response.data)
      setTransactions(response.data.content || [])
      setTotalPages(response.data.totalPages || 1)
    } catch (error) {
      console.error("[Admin Transactions] Failed to fetch transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      console.log("[Admin Transactions] Fetching stats from shared service")
      const response = await transactionAPI.getAdminStats()
      console.log("[Admin Transactions] Received stats:", response.data)
      setStats({
        totalVolume: response.data.totalVolume || 0,
        pendingCount: response.data.pendingTransactions || 0,
        completedCount: response.data.completedTransactions || 0,
        disputedCount: response.data.disputedTransactions || 0,
      })
    } catch (error) {
      console.error("[Admin Transactions] Failed to fetch stats:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "RELEASED":
      case "RENT_COMPLETED":
      case "DAMAGE_RESOLVED":
      case "DELIVERED_AUTO":
        return "bg-green-500/10 text-green-600"
      case "RENTAL_RETURNED":
      case "PARTIALLY_RELEASED":
        return "bg-teal-500/10 text-teal-600"
      case "PENDING":
      case "AUTHORIZED":
      case "HELD":
        return "bg-yellow-500/10 text-yellow-600"
      case "PENDING_RELEASE":
        return "bg-orange-500/10 text-orange-600"
      case "PENDING_DISPUTE":
      case "FAILED":
        return "bg-red-500/10 text-red-600"
      case "MANUAL_REVIEW":
        return "bg-orange-500/10 text-orange-600"
      case "CANCELLED":
      case "AUTO_CANCELLED":
      case "REFUNDED":
        return "bg-gray-500/10 text-gray-600"
      case "RENTAL_IN_PROGRESS":
      case "RENT_ACTIVE":
        return "bg-purple-500/10 text-purple-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const filteredTransactions = transactions.filter((txn) => {
    const buyerName = txn.buyer?.username || txn.buyerName || ""
    const sellerName = txn.seller?.username || txn.sellerName || ""
    const matchesSearch =
      txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sellerName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || txn.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
            <span className="truncate">Manage Transactions</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Monitor and manage all platform transactions</p>
        </div>
        <Button
          onClick={() => {
            fetchTransactions()
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

      {/* Stats - responsive grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Total Volume</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">${(stats.totalVolume / 100).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Completed</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.completedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Disputed</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats.disputedCount}</p>
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
                placeholder="Search transactions..."
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
                <SelectItem value="AUTHORIZED">In Escrow (Authorized)</SelectItem>
                <SelectItem value="HELD">In Escrow (Held)</SelectItem>
                <SelectItem value="PENDING_RELEASE">Release Requested</SelectItem>
                <SelectItem value="RELEASED">Released</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING_DISPUTE">Disputed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
                <SelectItem value="MANUAL_REVIEW">Manual Review</SelectItem>
                <SelectItem value="RENTAL_IN_PROGRESS">Rental Active</SelectItem>
                <SelectItem value="RENTAL_RETURNED">Item Returned</SelectItem>
                <SelectItem value="RENT_COMPLETED">Rental Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions - Card layout for mobile */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">All Transactions</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Complete transaction history</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {isLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-24 sm:h-16 w-full" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No transactions found</p>
              <p className="text-xs mt-2">Transactions created by users will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((txn, index) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 sm:p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs sm:text-sm truncate">{txn.id}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{txn.listing?.title || "N/A"}</p>
                      {txn.type && (
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] mt-1">
                          {txn.type}
                        </Badge>
                      )}
                    </div>
                    <Badge className={`${getStatusColor(txn.status)} text-[10px] sm:text-xs flex-shrink-0`}>
                      {txn.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div>
                      <span className="text-muted-foreground">Buyer: </span>
                      <span className="truncate font-mono">
                        {txn.buyer?.username || txn.buyerName ||
                         (txn.buyerId ? txn.buyerId.slice(0, 16) + "…" : "Unknown")}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Seller: </span>
                      <span className="truncate font-mono">
                        {txn.seller?.username || txn.sellerName ||
                         (txn.sellerId ? txn.sellerId.slice(0, 16) + "…" : "Unknown")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm sm:text-base">
                      ${((txn.amountCents || txn.amount || 0) / 100).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(txn.createdAt), { addSuffix: true })}
                      </span>
                      <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
                        <Link href={`/admin/transactions/${txn.id}`}>
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
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
    </div>
  )
}
