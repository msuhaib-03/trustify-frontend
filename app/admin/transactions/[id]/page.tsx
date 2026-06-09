"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ArrowLeft,
  Package,
  Calendar,
  DollarSign,
  User,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { transactionAPI } from "@/lib/api"
import { format } from "date-fns"
import { usdToPkr, getExchangeRate, formatUsd } from "@/lib/currency"
import Link from "next/link"

interface Transaction {
  id: string
  listingId: string
  listingTitle?: string
  listing?: {
    id: string
    title: string
    price: number
    type: "SALE" | "RENT"
    imageUrls?: string[]
  }
  buyerId: string
  buyerName?: string
  buyerEmail?: string
  sellerId: string
  sellerName?: string
  sellerEmail?: string
  amountCents: number
  depositCents?: number
  status: string   // keep as string — new statuses can be added server-side
  type: "SALE" | "RENT"
  createdAt: string
  updatedAt?: string
  stripePaymentIntentId?: string
  note?: string
  dispute?: {
    reason: string
    message: string
    status: "OPEN" | "RESOLVED"
    resolvedBy?: string
    resolution?: string
  }
  rentalDetails?: {
    startDate?: string
    endDate?: string
    expectedReturnDate?: string
    damageDeductionCents?: number
  }
}

// Real backend status values — keep in sync with Transaction.TransactionStatus enum
const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  PENDING:            { icon: Clock,         color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",  label: "Pending" },
  AUTHORIZED:         { icon: Clock,         color: "bg-blue-500/10 text-blue-600 border-blue-500/20",        label: "In Escrow" },
  HELD:               { icon: Clock,         color: "bg-blue-500/10 text-blue-600 border-blue-500/20",        label: "In Escrow" },
  PENDING_RELEASE:    { icon: Clock,         color: "bg-orange-500/10 text-orange-600 border-orange-500/20",  label: "Release Requested" },
  PARTIALLY_RELEASED: { icon: CheckCircle2,  color: "bg-teal-500/10 text-teal-600 border-teal-500/20",       label: "Partially Released" },
  RELEASED:           { icon: CheckCircle2,  color: "bg-green-500/10 text-green-600 border-green-500/20",    label: "Released" },
  COMPLETED:          { icon: CheckCircle2,  color: "bg-green-500/10 text-green-600 border-green-500/20",    label: "Completed" },
  REFUNDED:           { icon: XCircle,       color: "bg-blue-500/10 text-blue-600 border-blue-500/20",       label: "Refunded" },
  PENDING_DISPUTE:    { icon: AlertTriangle, color: "bg-red-500/10 text-red-600 border-red-500/20",          label: "Disputed" },
  CANCELLED:          { icon: XCircle,       color: "bg-gray-500/10 text-gray-600 border-gray-500/20",       label: "Cancelled" },
  AUTO_CANCELLED:     { icon: XCircle,       color: "bg-gray-500/10 text-gray-600 border-gray-500/20",       label: "Auto Cancelled" },
  FAILED:             { icon: XCircle,       color: "bg-red-500/10 text-red-600 border-red-500/20",          label: "Failed" },
  MANUAL_REVIEW:      { icon: AlertTriangle, color: "bg-orange-500/10 text-orange-600 border-orange-500/20", label: "Manual Review" },
  RENTAL_IN_PROGRESS: { icon: Clock,         color: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "Rental Active" },
  RENT_ACTIVE:        { icon: Clock,         color: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "Rental Active" },
  RENTAL_RETURNED:    { icon: CheckCircle2,  color: "bg-teal-500/10 text-teal-600 border-teal-500/20",       label: "Item Returned" },
  RENT_COMPLETED:     { icon: CheckCircle2,  color: "bg-green-500/10 text-green-600 border-green-500/20",    label: "Rental Completed" },
  DAMAGE_RESOLVED:    { icon: CheckCircle2,  color: "bg-green-500/10 text-green-600 border-green-500/20",    label: "Damage Resolved" },
  DELIVERED_AUTO:     { icon: CheckCircle2,  color: "bg-green-500/10 text-green-600 border-green-500/20",    label: "Auto Delivered" },
}

const fallbackStatusConfig = { icon: Clock, color: "bg-gray-500/10 text-gray-600 border-gray-500/20", label: "Unknown" }

function AdminTransactionDetailsContent() {
  const params = useParams()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchTransaction(params.id as string)
    }
  }, [params.id])

  const fetchTransaction = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await transactionAPI.getById(id)
      setTransaction(response.data)
    } catch (error) {
      console.error("Failed to fetch transaction:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 overflow-x-hidden max-w-full">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Transaction not found</h2>
        <p className="text-muted-foreground mb-4">
          The transaction you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/admin/transactions">Back to Transactions</Link>
        </Button>
      </div>
    )
  }

  const statusInfo = statusConfig[transaction.status] ?? fallbackStatusConfig
  const StatusIcon = statusInfo.icon

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9">
            <Link href="/admin/transactions">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <span className="truncate">Transaction Details</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono truncate">{transaction.id}</p>
          </div>
        </div>
        <Button
          onClick={() => fetchTransaction(transaction.id)}
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Status Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-2 ${statusInfo.color}`}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={`p-3 sm:p-4 rounded-xl ${statusInfo.color} self-start`}>
                <StatusIcon className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                <h3 className="text-xl sm:text-2xl font-bold">{statusInfo.label}</h3>
              </div>
              <div className="sm:text-right">
                <p className="text-xs sm:text-sm text-muted-foreground">Amount</p>
                <h3 className="text-xl sm:text-2xl font-bold text-primary">
                  {formatUsd(transaction.amountCents / 100)}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">PKR {usdToPkr(transaction.amountCents)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Transaction Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Transaction Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-xs sm:text-sm truncate">{transaction.id}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline" className="text-xs">
                    {transaction.type === "RENT" ? "Rental" : "Purchase"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Created</p>
                  <p className="text-xs sm:text-sm">{format(new Date(transaction.createdAt), "PPP")}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Updated</p>
                  <p className="text-xs sm:text-sm">
                    {transaction.updatedAt ? format(new Date(transaction.updatedAt), "PPP") : "-"}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Listing</p>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm font-medium truncate">
                    {transaction.listing?.title || transaction.listingTitle || `#${transaction.listingId.slice(0, 8)}`}
                  </p>
                </div>
              </div>

              {transaction.stripePaymentIntentId && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Payment Intent ID</p>
                    <p className="font-mono text-xs truncate">{transaction.stripePaymentIntentId}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Parties Involved */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                Parties Involved
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              {/* Buyer */}
              <div className="p-3 sm:p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Buyer</p>
                    <p className="font-medium text-sm sm:text-base truncate">
                      {transaction.buyerName || transaction.buyerEmail || transaction.buyerId.slice(0, 20) + "…"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{transaction.buyerId}</p>
                  </div>
                </div>
              </div>

              {/* Seller */}
              <div className="p-3 sm:p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Seller</p>
                    <p className="font-medium text-sm sm:text-base truncate">
                      {transaction.sellerName || transaction.sellerEmail || transaction.sellerId.slice(0, 20) + "…"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{transaction.sellerId}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Escrow / Payment Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              Escrow & Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg border text-center">
                <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                <p className="font-medium text-sm">Stripe</p>
              </div>
              <div className="p-3 rounded-lg border text-center">
                <p className="text-xs text-muted-foreground mb-1">Escrow Status</p>
                <Badge variant="outline" className="text-xs">
                  {["REFUNDED"].includes(transaction.status)
                    ? "Refunded"
                    : ["COMPLETED","RELEASED","RENT_COMPLETED","RENTAL_RETURNED","DAMAGE_RESOLVED","DELIVERED_AUTO"].includes(transaction.status)
                    ? "Released"
                    : ["CANCELLED","AUTO_CANCELLED","FAILED"].includes(transaction.status)
                    ? "Cancelled"
                    : "Held"}
                </Badge>
              </div>
              <div className="p-3 rounded-lg border text-center">
                <p className="text-xs text-muted-foreground mb-1">Exchange Rate</p>
                <p className="font-medium text-sm">1 USD = {getExchangeRate()} PKR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dispute Info (if applicable) */}
      {transaction.dispute && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-red-500/20">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-red-600">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                Dispute Information
              </CardTitle>
              <CardDescription>This transaction has an associated dispute</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Dispute Status</p>
                  <Badge
                    variant={transaction.dispute.status === "RESOLVED" ? "default" : "destructive"}
                    className="mt-1"
                  >
                    {transaction.dispute.status}
                  </Badge>
                </div>
                {transaction.dispute.resolvedBy && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Resolved By</p>
                    <p className="text-sm font-medium">{transaction.dispute.resolvedBy}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Reason</p>
                <p className="text-sm">{transaction.dispute.reason}</p>
              </div>
              {transaction.dispute.message && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Message</p>
                  <p className="text-sm">{transaction.dispute.message}</p>
                </div>
              )}
              {transaction.dispute.resolution && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Resolution</p>
                  <p className="text-sm">{transaction.dispute.resolution}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Rental Details (if applicable) */}
      {transaction.rentalDetails && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Rental Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {transaction.rentalDetails.startDate && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Start Date</p>
                    <p className="text-sm font-medium">
                      {format(new Date(transaction.rentalDetails.startDate), "PPP")}
                    </p>
                  </div>
                )}
                {transaction.rentalDetails.expectedReturnDate && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Expected Return</p>
                    <p className="text-sm font-medium">
                      {format(new Date(transaction.rentalDetails.expectedReturnDate), "PPP")}
                    </p>
                  </div>
                )}
                {transaction.rentalDetails.endDate && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Actual Return</p>
                    <p className="text-sm font-medium">{format(new Date(transaction.rentalDetails.endDate), "PPP")}</p>
                  </div>
                )}
                {transaction.rentalDetails.damageDeductionCents !== undefined &&
                  transaction.rentalDetails.damageDeductionCents > 0 && (
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Damage Deduction</p>
                      <p className="text-sm font-medium text-red-600">
                        ${(transaction.rentalDetails.damageDeductionCents / 100).toFixed(2)}
                      </p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Notes (if any) */}
      {transaction.note && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="text-sm text-muted-foreground">{transaction.note}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

export default function AdminTransactionDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <AdminTransactionDetailsContent />
    </Suspense>
  )
}
