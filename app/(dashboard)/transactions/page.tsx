"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Receipt, Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Lock, RotateCcw, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BackButton } from "@/components/back-button"
import { useAuth } from "@/context/auth-context"
import { transactionAPI } from "@/lib/api"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { usdToPkr } from "@/lib/currency"

type TxStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "PAYMENT_FAILED"
  | "AUTHORIZED"
  | "HELD"
  | "PENDING_RELEASE"
  | "PARTIALLY_RELEASED"
  | "RELEASED"
  | "COMPLETED"
  | "REFUNDED"
  | "PENDING_DISPUTE"
  | "DISPUTED"
  | "MANUAL_REVIEW"
  | "RENTAL_IN_PROGRESS"
  | "RENT_ACTIVE"
  | "RENTAL_RETURNED"
  | "RENT_COMPLETED"
  | "CANCELLED"
  | "AUTO_CANCELLED"
  | "FAILED"

interface Transaction {
  id: string
  listingId: string
  listing?: {
    title: string
    imageUrls?: string[]
  }
  buyerId: string
  sellerId: string
  amountCents: number
  status: TxStatus
  type: "SALE" | "RENT"
  createdAt: string
}

const statusConfig: Record<TxStatus, { icon: React.ElementType; color: string; label: string }> = {
  PENDING:             { icon: Clock,         color: "bg-yellow-500/10 text-yellow-600", label: "Pending" },
  AWAITING_PAYMENT:    { icon: Clock,         color: "bg-yellow-500/10 text-yellow-600", label: "Awaiting Payment" },
  PAYMENT_FAILED:      { icon: XCircle,       color: "bg-red-500/10 text-red-600",       label: "Payment Failed" },
  AUTHORIZED:          { icon: Lock,          color: "bg-blue-500/10 text-blue-600",     label: "In Escrow" },
  HELD:                { icon: Lock,          color: "bg-blue-500/10 text-blue-600",     label: "Held in Escrow" },
  PENDING_RELEASE:     { icon: Clock,         color: "bg-orange-500/10 text-orange-600", label: "Release Requested" },
  PARTIALLY_RELEASED:  { icon: Clock,         color: "bg-orange-500/10 text-orange-600", label: "Partially Released" },
  RELEASED:            { icon: CheckCircle2,  color: "bg-green-500/10 text-green-600",   label: "Released" },
  COMPLETED:           { icon: CheckCircle2,  color: "bg-green-500/10 text-green-600",   label: "Completed" },
  REFUNDED:            { icon: RotateCcw,     color: "bg-blue-500/10 text-blue-600",     label: "Refunded" },
  PENDING_DISPUTE:     { icon: AlertTriangle, color: "bg-red-500/10 text-red-600",       label: "Dispute Pending" },
  DISPUTED:            { icon: AlertTriangle, color: "bg-red-500/10 text-red-600",       label: "Disputed" },
  MANUAL_REVIEW:       { icon: AlertTriangle, color: "bg-red-500/10 text-red-600",       label: "Under Review" },
  RENTAL_IN_PROGRESS:  { icon: Truck,         color: "bg-purple-500/10 text-purple-600", label: "Rental Active" },
  RENT_ACTIVE:         { icon: Truck,         color: "bg-purple-500/10 text-purple-600", label: "Rental Active" },
  RENTAL_RETURNED:     { icon: CheckCircle2,  color: "bg-green-500/10 text-green-600",   label: "Item Returned" },
  RENT_COMPLETED:      { icon: CheckCircle2,  color: "bg-green-500/10 text-green-600",   label: "Rental Completed" },
  CANCELLED:           { icon: XCircle,       color: "bg-gray-500/10 text-gray-600",     label: "Cancelled" },
  AUTO_CANCELLED:      { icon: XCircle,       color: "bg-gray-500/10 text-gray-600",     label: "Auto Cancelled" },
  FAILED:              { icon: XCircle,       color: "bg-red-500/10 text-red-600",       label: "Failed" },
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

  const fetchTransactions = async () => {
    try {
      const response = await transactionAPI.getAll({ userId: user?.id || user?.email })
      setTransactions(response.data.content || [])
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
      toast.error("Failed to load transactions")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    if (activeTab === "all") return true
    if (activeTab === "pending") return ["PENDING", "AWAITING_PAYMENT", "AUTHORIZED", "HELD", "PENDING_RELEASE", "PARTIALLY_RELEASED"].includes(t.status)
    if (activeTab === "completed") return ["COMPLETED", "RELEASED", "RENT_COMPLETED", "RENTAL_RETURNED", "REFUNDED"].includes(t.status)
    if (activeTab === "disputed") return ["DISPUTED", "PENDING_DISPUTE", "MANUAL_REVIEW"].includes(t.status)
    return true
  })

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton fallbackUrl="/home" />
        <h1 className="text-2xl font-bold">Transactions</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="disputed">Disputed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map((transaction, index) => {
                const statusInfo = statusConfig[transaction.status] ?? statusConfig.PENDING
                const StatusIcon = statusInfo.icon

                return (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/transactions/${transaction.id}`}>
                      <Card className="hover:shadow-md transition-all cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${statusInfo.color}`}>
                              <StatusIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold truncate">
                                  {transaction.listing?.title || `Transaction #${transaction.id.slice(0, 8)}`}
                                </h4>
                                <Badge variant="outline">{transaction.type === "RENT" ? "Rental" : "Purchase"}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                Rs. {usdToPkr(transaction.amountCents)}
                              </p>
                              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-semibold mb-2">No transactions yet</h4>
              <p className="text-muted-foreground mb-4">Your transaction history will appear here</p>
              <Link href="/listings">
                <Button>Browse Listings</Button>
              </Link>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
