"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Clock, CheckCircle2, XCircle, AlertTriangle, CreditCard,
  ArrowUpRight, ArrowDownLeft, MessageSquare, RefreshCw, Flag,
  Loader2, PlayCircle, StopCircle, Wrench, DollarSign, FileCheck,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BackButton } from "@/components/back-button"
import { useAuth } from "@/context/auth-context"
import { transactionAPI, listingAPI } from "@/lib/api"
import { createChat } from "@/services/chat/chatApi"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { usdToPkr, getExchangeRate } from "@/lib/currency"

// ─── Real backend status values ──────────────────────────────────────────────
type TxStatus =
  | "PENDING" | "AUTHORIZED" | "HELD"
  | "PENDING_RELEASE" | "PARTIALLY_RELEASED" | "RELEASED"
  | "PENDING_DISPUTE" | "REFUNDED" | "CANCELLED" | "FAILED"
  | "MANUAL_REVIEW" | "COMPLETED"
  | "RENTAL_IN_PROGRESS" | "RENT_ACTIVE"
  | "RENTAL_RETURNED" | "RENT_COMPLETED"
  | "DAMAGE_RESOLVED" | "DELIVERED_AUTO" | "AUTO_CANCELLED"

interface Transaction {
  id: string
  listingId: string
  listingTitle?: string
  listing?: { id: string; title: string; price: number; type: "SALE" | "RENT"; imageUrls?: string[] }
  buyerId: string
  buyerEmail?: string   // backend also stores email separately
  buyerName?: string
  sellerId: string
  sellerEmail?: string  // backend also stores email separately
  sellerName?: string
  amountCents: number
  depositCents?: number
  rentalFeeCents?: number
  authorizedAmountCents?: number
  buyerAcceptedCondition?: boolean
  status: TxStatus
  type: "SALE" | "RENT"
  createdAt: string
  stripePaymentIntentId?: string
}

const statusConfig: Record<string, { icon: any; color: string; label: string; description: string }> = {
  PENDING:            { icon: Clock,         color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",  label: "Pending",            description: "Awaiting payment confirmation" },
  AUTHORIZED:         { icon: Clock,         color: "bg-blue-500/10 text-blue-600 border-blue-500/20",        label: "In Escrow",          description: "Funds are held securely in escrow" },
  HELD:               { icon: Clock,         color: "bg-blue-500/10 text-blue-600 border-blue-500/20",        label: "In Escrow",          description: "Funds are held securely in escrow" },
  PENDING_RELEASE:    { icon: Clock,         color: "bg-orange-500/10 text-orange-600 border-orange-500/20", label: "Release Requested",  description: "Buyer has requested fund release" },
  PARTIALLY_RELEASED: { icon: CheckCircle2,  color: "bg-teal-500/10 text-teal-600 border-teal-500/20",       label: "Partially Released", description: "Partial payment has been captured" },
  RELEASED:           { icon: CheckCircle2,  color: "bg-green-500/10 text-green-600 border-green-500/20",    label: "Released",           description: "Payment released to seller" },
  COMPLETED:          { icon: CheckCircle2,  color: "bg-green-500/10 text-green-600 border-green-500/20",    label: "Completed",          description: "Transaction completed successfully" },
  REFUNDED:           { icon: XCircle,       color: "bg-blue-500/10 text-blue-600 border-blue-500/20",       label: "Refunded",           description: "Payment was refunded to buyer" },
  PENDING_DISPUTE:    { icon: AlertTriangle, color: "bg-red-500/10 text-red-600 border-red-500/20",          label: "Disputed",           description: "A dispute has been opened — admin will review" },
  CANCELLED:          { icon: XCircle,       color: "bg-gray-500/10 text-gray-600 border-gray-500/20",       label: "Cancelled",          description: "Transaction was cancelled" },
  AUTO_CANCELLED:     { icon: XCircle,       color: "bg-gray-500/10 text-gray-600 border-gray-500/20",       label: "Auto Cancelled",     description: "Transaction was automatically cancelled" },
  FAILED:             { icon: XCircle,       color: "bg-red-500/10 text-red-600 border-red-500/20",          label: "Failed",             description: "Transaction failed" },
  MANUAL_REVIEW:      { icon: AlertTriangle, color: "bg-orange-500/10 text-orange-600 border-orange-500/20", label: "Manual Review",      description: "Under review due to risk signals" },
  RENTAL_IN_PROGRESS: { icon: PlayCircle,    color: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "Rental Active",      description: "Item is currently rented out" },
  RENT_ACTIVE:        { icon: PlayCircle,    color: "bg-purple-500/10 text-purple-600 border-purple-500/20", label: "Rental Active",      description: "Item is currently rented out" },
  RENTAL_RETURNED:    { icon: StopCircle,    color: "bg-teal-500/10 text-teal-600 border-teal-500/20",       label: "Item Returned",      description: "Item returned — owner needs to finalize the rental to release payment" },
  RENT_COMPLETED:     { icon: CheckCircle2,  color: "bg-teal-500/10 text-teal-600 border-teal-500/20",       label: "Rental Completed",   description: "Rental completed successfully" },
  DAMAGE_RESOLVED:    { icon: CheckCircle2,  color: "bg-green-500/10 text-green-600 border-green-500/20",    label: "Damage Resolved",    description: "Damage claim has been resolved" },
  DELIVERED_AUTO:     { icon: CheckCircle2,  color: "bg-green-500/10 text-green-600 border-green-500/20",    label: "Auto Delivered",     description: "Automatically marked as delivered" },
}

const fallbackStatus = { icon: Clock, color: "bg-gray-500/10 text-gray-600 border-gray-500/20", label: "Unknown", description: "" }

// ── Module-level helper — must NOT be inside the component or React
// creates a new function reference on every render, unmounting the subtree
// and closing any open dialogs when state changes (e.g. typing in a Textarea).
function WaitingInfo({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border text-sm text-muted-foreground">
      <Info className="h-4 w-4 flex-shrink-0 text-blue-500" />
      {text}
    </div>
  )
}

export default function TransactionDetailsPage() {
  const params  = useParams()
  const router  = useRouter()
  const { user } = useAuth()

  const [transaction,   setTransaction]   = useState<Transaction | null>(null)
  const [listingTitle,  setListingTitle]  = useState<string | null>(null)
  const [isLoading,     setIsLoading]     = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [disputeReason, setDisputeReason] = useState("")
  const [disputeMessage,setDisputeMessage]= useState("")
  const [damageAmount,  setDamageAmount]  = useState("")
  // ── Controlled dispute dialog — defined here so typing never re-mounts it ──
  const [disputeOpen,   setDisputeOpen]   = useState(false)

  useEffect(() => { if (params.id) fetchTransaction(params.id as string) }, [params.id])

  // Fetch listing title once transaction is loaded (non-blocking — failure is silent)
  useEffect(() => {
    if (!transaction?.listingId) return
    // If title is already available from the transaction object, use it directly
    const existing = transaction.listing?.title || transaction.listingTitle
    if (existing) { setListingTitle(existing); return }
    listingAPI.getById(transaction.listingId)
      .then((res) => {
        const title = res.data?.title || res.data?.name
        if (title) setListingTitle(title)
      })
      .catch(() => {/* silently ignore — fallback to ID already shown */})
  }, [transaction?.listingId])

  const fetchTransaction = async (id: string) => {
    for (let i = 0; i < 5; i++) {
      try {
        if (i === 0) await new Promise((r) => setTimeout(r, 100))
        const res = await transactionAPI.getById(id)
        setTransaction(res.data)
        setIsLoading(false)
        return
      } catch {
        if (i === 4) { toast.error("Failed to load transaction"); setIsLoading(false) }
        else await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)))
      }
    }
  }

  const runAction = async (key: string, fn: () => Promise<void>, successMsg: string) => {
    setActionLoading(key)
    try {
      await fn()
      toast.success(successMsg)
      fetchTransaction(transaction!.id)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Action failed")
    } finally {
      setActionLoading(null)
    }
  }

  const handleAcceptConditions = () =>
    runAction("accept", () => transactionAPI.acceptConditions(transaction!.id, user!.id || user!.email || ""), "Conditions accepted")

  const handleRequestRelease = () =>
    runAction(
      "release",
      () => transactionAPI.requestRelease(transaction!.id, "Item received in good condition"),
      isRent
        ? "Release requested — seller will now confirm"
        : "Payment released to seller — transaction complete!"
    )

  const handleConfirmRelease = () =>
    runAction("confirm", () => transactionAPI.confirmRelease(transaction!.id, transaction!.authorizedAmountCents || transaction!.amountCents), "Payment released to seller!")

  const handleStartRental = () =>
    runAction("start-rental", () => transactionAPI.startRental(transaction!.id), "Rental started — enjoy your item!")

  const handleCompleteRental = () =>
    runAction("complete-rental", () => transactionAPI.completeRental(transaction!.id), "Return confirmed — seller will now process the deposit")

  const handleFinalizeRefund = () =>
    runAction("finalize-refund", () => transactionAPI.finalizeRefund(transaction!.id), "Rental complete — payment released to you, deposit returned to renter!")

  const handleDeductDamage = () => {
    const cents = Math.round(parseFloat(damageAmount) * 100)
    if (!cents || cents <= 0) { toast.error("Enter a valid damage amount in USD"); return }
    runAction("damage", () => transactionAPI.deductDamage(transaction!.id, cents), "Damage deducted — rental complete, remainder returned to renter!")
  }

  const handleRefund = () =>
    runAction("refund", () => transactionAPI.refund(transaction!.id), "Refund initiated")

  const handleDispute = async () => {
    if (!transaction || !disputeReason) return
    setActionLoading("dispute")
    try {
      // POST /transactions/{id}/dispute handles everything:
      // creates the Dispute record, sets status to PENDING_DISPUTE, logs events.
      // Do NOT also call disputeAPI.create — that hits a separate /disputes endpoint
      // which has no controller and returns 500.
      await transactionAPI.dispute(transaction.id, { reason: disputeReason, evidence: disputeMessage })
      toast.success("Dispute opened — an admin will review")
      setDisputeOpen(false)
      setDisputeReason("")
      setDisputeMessage("")
      fetchTransaction(transaction.id)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to open dispute")
    } finally {
      setActionLoading(null)
    }
  }

  // ── Loading / not-found guards ────────────────────────────────────────────
  if (isLoading) return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-1/3" /><Skeleton className="h-10 w-1/2" /><Skeleton className="h-4 w-full" />
        </CardContent></Card>
      </div>
    </div>
  )

  if (!transaction) return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Transaction not found</h2>
      <Button onClick={() => router.push("/transactions")}>Back to Transactions</Button>
    </div>
  )

  const handleContactUser = async () => {
    const myId    = user?.id || user?.email || ""
    const otherId = isBuyer ? transaction.sellerId : transaction.buyerId
    if (!myId || !otherId) { toast.error("User info missing"); return }
    try {
      const response = await createChat([myId, otherId])
      router.push(`/chat/${response.data.id}`)
    } catch {
      toast.error("Could not open chat")
    }
  }

  const info       = statusConfig[transaction.status] || fallbackStatus
  const StatusIcon = info.icon
  const s          = transaction.status
  const isRent     = transaction.type === "RENT"

  // Converts "saeed@gmail.com" → "Saeed", "john.doe@x.com" → "John Doe"
  // Falls back to email prefix, then truncated ID
  const displayName = (name?: string, email?: string, id?: string) =>
    name ||
    (email
      ? email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : null) ||
    (id ? `${id.slice(0, 12)}…` : "Unknown")

  // ── Identity checks — uses email fields too, so stored ObjectId vs email ──
  // mismatch no longer causes the wrong role (or no role) to be detected ──────
  const isBuyer = !!user && (
    user.id    === transaction.buyerId  ||
    user.email === transaction.buyerId  ||
    (!!transaction.buyerEmail  && user.email === transaction.buyerEmail)
  )
  const isSeller = !!user && (
    user.id    === transaction.sellerId ||
    user.email === transaction.sellerId ||
    (!!transaction.sellerEmail && user.email === transaction.sellerEmail)
  )
  const isAdmin = user?.role?.toUpperCase() === "ADMIN"

  // ── Status predicates ─────────────────────────────────────────────────────
  const isEscrow          = s === "AUTHORIZED" || s === "HELD"
  const isPendingRelease  = s === "PENDING_RELEASE"
  const isRentalActive    = s === "RENTAL_IN_PROGRESS" || s === "RENT_ACTIVE"
  const isRentalReturned  = s === "RENTAL_RETURNED"
  const isDamageResolved  = s === "DAMAGE_RESOLVED"
  const isTerminal        = ["RELEASED","COMPLETED","REFUNDED","CANCELLED","AUTO_CANCELLED","FAILED","RENT_COMPLETED"].includes(s)

  const amountUsd = transaction.amountCents / 100
  const amountPkr = usdToPkr(transaction.amountCents)

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton fallbackUrl="/transactions" />
          <h1 className="text-2xl font-bold">Transaction Details</h1>
        </div>

        {/* Status card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={`border-2 ${info.color}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-xl ${info.color}`}><StatusIcon className="h-8 w-8" /></div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <h3 className="text-2xl font-bold">{info.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{info.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <h3 className="text-2xl font-bold text-primary">Rs. {amountPkr}</h3>
                  <p className="text-xs text-muted-foreground mt-1">${amountUsd.toFixed(2)} USD</p>
                  {isRent && transaction.depositCents && (
                    <p className="text-xs text-muted-foreground">Deposit: Rs. {usdToPkr(transaction.depositCents)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader><CardTitle>Transaction Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Transaction ID</p><p className="font-mono text-sm">{transaction.id}</p></div>
                <div><p className="text-sm text-muted-foreground">Type</p><Badge variant="outline">{isRent ? "Rental" : "Purchase"}</Badge></div>
                <div><p className="text-sm text-muted-foreground">Created</p><p>{format(new Date(transaction.createdAt), "PPP")}</p></div>
                <div>
                  <p className="text-sm text-muted-foreground">Listing</p>
                  <p>{listingTitle || transaction.listing?.title || transaction.listingTitle || `#${transaction.listingId.slice(0, 8)}`}</p>
                </div>
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10"><ArrowUpRight className="h-5 w-5 text-green-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Seller</p>
                    <p className="font-medium">{displayName(transaction.sellerName, transaction.sellerEmail, transaction.sellerId)}</p>
                    {transaction.sellerEmail && <p className="text-xs text-muted-foreground">{transaction.sellerEmail}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10"><ArrowDownLeft className="h-5 w-5 text-blue-600" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Buyer</p>
                    <p className="font-medium">{displayName(transaction.buyerName, transaction.buyerEmail, transaction.buyerId)}</p>
                    {transaction.buyerEmail && <p className="text-xs text-muted-foreground">{transaction.buyerEmail}</p>}
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border text-center text-xs text-muted-foreground">
                Exchange Rate: 1 USD = {getExchangeRate()} PKR
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ─── Action panel — shown while transaction is active ─────────────── */}
        {!isTerminal && (isBuyer || isSeller || isAdmin) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  {isBuyer  && "Your role: Buyer / Renter"}
                  {isSeller && "Your role: Seller / Owner"}
                  {isAdmin  && !isBuyer && !isSeller && "Admin view"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">

                {/* ════════════════ SALE FLOW ════════════════════════════════ */}

                {/* SALE — BUYER in escrow */}
                {isEscrow && !isRent && isBuyer && (
                  <div className="space-y-3">
                    {/* Step 1: accept conditions */}
                    {!transaction.buyerAcceptedCondition && (
                      <Button onClick={handleAcceptConditions} disabled={actionLoading === "accept"} className="w-full gap-2">
                        {actionLoading === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                        Accept Escrow Conditions
                      </Button>
                    )}
                    {/* Step 2: request release once item received */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={handleRequestRelease}
                        disabled={actionLoading === "release"}
                        className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent"
                      >
                        {actionLoading === "release" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        I Received the Item
                      </Button>
                      <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={() => setDisputeOpen(true)}>
                        <Flag className="h-4 w-4" /> Open Dispute
                      </Button>
                    </div>
                  </div>
                )}

                {/* SALE — SELLER in escrow: waiting for buyer */}
                {isEscrow && !isRent && isSeller && (
                  <WaitingInfo text="Waiting for buyer to confirm they received the item. Once confirmed you can release the payment." />
                )}

                {/* SALE — SELLER in PENDING_RELEASE: confirm or refund */}
                {isPendingRelease && (isSeller || isAdmin) && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleConfirmRelease} disabled={actionLoading === "confirm"} className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent">
                      {actionLoading === "confirm" ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
                      Confirm & Release — Receive Payment
                    </Button>
                    <Button variant="outline" onClick={handleRefund} disabled={actionLoading === "refund"} className="flex-1 gap-2 bg-transparent">
                      {actionLoading === "refund" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Issue Refund to Buyer
                    </Button>
                  </div>
                )}

                {/* SALE — BUYER in PENDING_RELEASE: waiting for seller */}
                {isPendingRelease && isBuyer && (
                  <WaitingInfo text="Release requested. Waiting for seller to confirm and release the payment." />
                )}

                {/* ════════════════ RENTAL FLOW ══════════════════════════════ */}

                {/* RENT — BUYER in escrow: accept conditions + start rental */}
                {isEscrow && isRent && isBuyer && (
                  <div className="space-y-3">
                    {!transaction.buyerAcceptedCondition ? (
                      <Button onClick={handleAcceptConditions} disabled={actionLoading === "accept"} className="w-full gap-2">
                        {actionLoading === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                        Accept Rental Conditions
                      </Button>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={handleStartRental} disabled={actionLoading === "start-rental"} className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent">
                          {actionLoading === "start-rental" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                          I've Picked Up the Item — Start Rental
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={() => setDisputeOpen(true)}>
                          <Flag className="h-4 w-4" /> Open Dispute
                        </Button>
                      </div>
                    )}
                    {transaction.buyerAcceptedCondition && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Conditions accepted
                      </p>
                    )}
                  </div>
                )}

                {/* RENT — SELLER in escrow: waiting for buyer to pick up */}
                {isEscrow && isRent && isSeller && (
                  <WaitingInfo text={
                    transaction.buyerAcceptedCondition
                      ? "Buyer has accepted conditions. Waiting for them to confirm pickup."
                      : "Waiting for buyer to accept rental conditions and confirm item pickup."
                  } />
                )}

                {/* RENT — BUYER in rental active: return the item */}
                {isRentalActive && isBuyer && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleCompleteRental} disabled={actionLoading === "complete-rental"} className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent">
                      {actionLoading === "complete-rental" ? <Loader2 className="h-4 w-4 animate-spin" /> : <StopCircle className="h-4 w-4" />}
                      I've Returned the Item
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={() => setDisputeOpen(true)}>
                      <Flag className="h-4 w-4" /> Open Dispute
                    </Button>
                  </div>
                )}

                {/* RENT — SELLER in rental active: waiting for return */}
                {isRentalActive && isSeller && (
                  <div className="space-y-3">
                    <WaitingInfo text="Rental is active. Waiting for the renter to return the item." />
                    {/* Seller can also mark as returned (e.g. renter returned but forgot to click) */}
                    <Button
                      variant="outline"
                      onClick={handleCompleteRental}
                      disabled={actionLoading === "complete-rental"}
                      className="w-full gap-2 bg-transparent"
                    >
                      {actionLoading === "complete-rental" ? <Loader2 className="h-4 w-4 animate-spin" /> : <StopCircle className="h-4 w-4" />}
                      Item Has Been Returned (mark returned)
                    </Button>
                  </div>
                )}

                {/* RENT — SELLER after return: finalize in one click */}
                {(isRentalReturned || isDamageResolved) && (isSeller || isAdmin) && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Finalize rental — item has been returned:</p>
                    <p className="text-xs text-muted-foreground">
                      Choosing an option captures your rental fee and simultaneously releases the
                      {transaction.depositCents ? " security deposit" : " remaining authorized amount"} back to the renter — all in one step.
                    </p>

                    {/* Path A: no damage */}
                    <Button
                      onClick={handleFinalizeRefund}
                      disabled={actionLoading === "finalize-refund"}
                      className="w-full gap-2 bg-gradient-to-r from-primary to-accent"
                    >
                      {actionLoading === "finalize-refund"
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <CheckCircle2 className="h-4 w-4" />}
                      No Damage — Complete Rental &amp; Get Paid
                    </Button>

                    {/* Path B: there is damage — deduct from deposit */}
                    {transaction.depositCents ? (
                      <>
                        <Separator />
                        <p className="text-sm text-muted-foreground">— or — report damage (max: ${((transaction.depositCents) / 100).toFixed(2)} deposit):</p>
                        <div className="flex gap-3">
                          <Input
                            type="number"
                            placeholder="Damage in USD (e.g. 5.00)"
                            value={damageAmount}
                            onChange={(e) => setDamageAmount(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={handleDeductDamage}
                            disabled={actionLoading === "damage"}
                            className="gap-2 bg-transparent"
                          >
                            {actionLoading === "damage" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                            Deduct &amp; Complete
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          You'll receive the rental fee + damage amount. The remainder of the deposit is returned to the renter automatically.
                        </p>
                      </>
                    ) : null}
                  </div>
                )}

                {/* RENT — BUYER after return: waiting for seller to process */}
                {(isRentalReturned || isDamageResolved) && isBuyer && (
                  <WaitingInfo text="Item returned. Waiting for the owner to finalize the rental. Your deposit will be returned to your card automatically once they complete this step." />
                )}

                {/* Dispute state */}
                {s === "PENDING_DISPUTE" && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-700 dark:text-red-400">
                    A dispute is open. An admin will review the case and resolve it.
                  </div>
                )}

                {/* Manual review */}
                {s === "MANUAL_REVIEW" && (
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-sm text-orange-700 dark:text-orange-400">
                    This transaction is under manual review by an admin due to risk signals.
                  </div>
                )}

                <Separator />

                {/* Contact — always shown while active */}
                <Button variant="ghost" className="w-full gap-2" onClick={handleContactUser}>
                  <MessageSquare className="h-4 w-4" />
                  Contact {isBuyer ? "Seller" : "Buyer"}
                </Button>

              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Payment info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Payment Information</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Payment Method</span><span>Stripe Escrow</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Escrow Status</span>
                <Badge variant="outline">
                  {["RELEASED","COMPLETED","RENT_COMPLETED"].includes(s) ? "Released" : s === "REFUNDED" ? "Refunded" : "Held"}
                </Badge>
              </div>
              {transaction.stripePaymentIntentId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Intent</span>
                  <span className="font-mono text-sm">{transaction.stripePaymentIntentId.slice(0, 16)}…</span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* ── Dispute dialog — rendered ONCE at the top level so typing never
           re-mounts it. The open/close is controlled by disputeOpen state.  ── */}
      <AlertDialog open={disputeOpen} onOpenChange={(open) => {
        setDisputeOpen(open)
        if (!open) { setDisputeReason(""); setDisputeMessage("") }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Open a Dispute</AlertDialogTitle>
            <AlertDialogDescription>
              Describe your issue clearly. An admin will review and resolve it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Brief reason (e.g. Item not received, Wrong item sent…)"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Details / Evidence</Label>
              <Textarea
                placeholder="Describe what happened in detail…"
                value={disputeMessage}
                onChange={(e) => setDisputeMessage(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDispute}
              disabled={!disputeReason || actionLoading === "dispute"}
            >
              {actionLoading === "dispute" && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Submit Dispute
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
