"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Shield, Lock, Loader2, Check, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/back-button"
import { VerificationRequiredModal } from "@/components/verification-required-modal"
import { StripePaymentForm } from "@/components/stripe-payment-form"
import { listingAPI, transactionAPI, cnicAPI } from "@/lib/api"
import { getStripe } from "@/lib/stripe"
import { useAuth } from "@/context/auth-context"
import { usdToPkr, formatPkr, formatUsd, getExchangeRate } from "@/lib/currency"
import { toast } from "sonner"
import { Elements } from "@stripe/react-stripe-js"

interface Listing {
  id?: string
  title: string
  description?: string
  price: number                     // USD amount
  depositAmountUsd?: number         // optional security deposit in USD
  rentalPeriod?: "PER_HOUR" | "PER_DAY"
  type: "SALE" | "RENT"
  imageUrls?: string[]
  ownerId?: string
  seller?: {
    id: string
    username: string
    email?: string
  }
}

function NewTransactionContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const listingId = searchParams.get("listingId")
  // Optional: seller ID can be passed in URL as a fallback for when the listing endpoint omits it
  const sellerIdFromUrl = searchParams.get("sellerId")

  const [listing, setListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)

  // Rental duration — number of days or hours the buyer wants
  const [rentalDuration, setRentalDuration] = useState(1)

  // Two-step flow: first create the PaymentIntent, then collect card
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  useEffect(() => {
    if (listingId) {
      initializeTransaction(listingId)
      checkVerificationStatus()
    } else {
      router.push("/listings")
    }
  }, [listingId, router])

  const checkVerificationStatus = async () => {
    try {
      const response = await cnicAPI.isVerified()
      setIsVerified(response.data.verified)
      if (!response.data.verified) {
        setShowVerificationModal(true)
      }
    } catch {
      setIsVerified(false)
      setShowVerificationModal(true)
    }
  }

  const initializeTransaction = async (id: string) => {
    try {
      const listingResponse = await listingAPI.getById(id)
      const listingData = { ...listingResponse.data }

      // GET /listings/{id} returns a ListingDTO that may omit ownerId (backend bug, fixed but needs restart).
      // Fallback: scan /listings/rent + /listings/sell which return full Listing objects with ownerId.
      if (!listingData.ownerId) {
        try {
          const [rentRes, saleRes] = await Promise.all([
            listingAPI.getRent(),
            listingAPI.getSale(),
          ])
          const all = [...(rentRes.data || []), ...(saleRes.data || [])]
          const full = all.find((l: any) => l.id === id)
          if (full?.ownerId) listingData.ownerId = full.ownerId
        } catch {
          // fallback failed — ownerId may still be missing; will show error at payment time
        }
      }

      setListing(listingData)
    } catch {
      toast.error("Failed to load listing")
      router.push("/listings")
    } finally {
      setIsLoading(false)
    }
  }

  // Step 1 — create the PaymentIntent on the backend, get back a clientSecret
  const handleCreatePaymentIntent = async () => {
    if (!listing || !listingId || !user) {
      toast.error("Missing required information")
      return
    }

    if (!isVerified) {
      setShowVerificationModal(true)
      return
    }

    // ownerId now returned by the fixed backend GET /listings/{id} endpoint
    // sellerIdFromUrl is a URL-param fallback for edge cases
    const sellerId = listing.ownerId || listing.seller?.id || sellerIdFromUrl
    if (!sellerId) {
      toast.error("Seller information not available — please go back and try again")
      console.error("[checkout] listing response missing ownerId:", listing)
      return
    }

    if (user.id === sellerId || user.email === listing.seller?.email) {
      toast.error("You cannot buy your own listing")
      return
    }

    setIsProcessing(true)

    try {
      // listing.price is in USD; amountCents = USD × duration × 100
      // For rentals, multiply by the chosen duration; for sales it's always 1 unit.
      const duration      = listing.type === "RENT" ? Math.max(1, rentalDuration) : 1
      const rentalFeeCents = Math.round(listing.price * duration * 100)
      const depositCents   = listing.type === "RENT" && listing.depositAmountUsd
        ? Math.round(listing.depositAmountUsd * 100)
        : 0

      const response = await transactionAPI.create({
        listingId,
        buyerId: user.id || user.email || "",
        sellerId,
        amountCents: rentalFeeCents,
        depositCents,
        currency: "usd",
        type: listing.type,
        ...(listing.type === "RENT" && {
          rentalDurationUnits: duration,
          rentalPeriod: listing.rentalPeriod,
        }),
      })

      const { transactionId: txId, stripeClientSecret } = response.data

      if (!stripeClientSecret) {
        toast.error("Backend did not return a payment client secret")
        return
      }

      setTransactionId(txId)
      setClientSecret(stripeClientSecret)
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to create transaction"
      toast.error(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  // Step 2 — called by StripePaymentForm after confirmCardPayment succeeds
  const handlePaymentSuccess = () => {
    toast.success("Payment authorized — funds held in escrow")
    router.push(`/transactions/${transactionId}`)
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Unable to process payment</h2>
        <Button onClick={() => router.push("/listings")}>Back to Listings</Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton fallbackUrl={listingId ? `/listings/${listingId}` : "/listings"} />
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>

        {/* Order Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={listing.imageUrls?.[0] || "/placeholder.svg?height=96&width=96&query=product"}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{listing.title}</h3>
                  <p className="text-sm text-muted-foreground">{listing.type === "RENT" ? "Rental" : "Purchase"}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xl font-bold text-primary">
                      {formatPkr(listing.price * getExchangeRate())}
                      {listing.type === "RENT" && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          /{listing.rentalPeriod === "PER_HOUR" ? "hr" : "day"}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      = {formatUsd(listing.price)} USD &nbsp;·&nbsp; 1 USD = {getExchangeRate()} PKR
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Rental duration picker — only for RENT listings ── */}
              {listing.type === "RENT" && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">
                    How many {listing.rentalPeriod === "PER_HOUR" ? "hours" : "days"} do you need it for?
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => setRentalDuration(d => Math.max(1, d - 1))}
                      disabled={rentalDuration <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={rentalDuration}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10)
                        if (!isNaN(val) && val >= 1) setRentalDuration(val)
                      }}
                      className="w-16 text-center text-lg font-semibold border rounded-md py-1 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => setRentalDuration(d => Math.min(365, d + 1))}
                      disabled={rentalDuration >= 365}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {listing.rentalPeriod === "PER_HOUR" ? "hour(s)" : "day(s)"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatPkr(listing.price * getExchangeRate())} × {rentalDuration}{" "}
                    {listing.rentalPeriod === "PER_HOUR" ? "hr" : "day"}{rentalDuration > 1 ? "s" : ""}{" "}
                    = <span className="font-semibold text-foreground">
                        {formatPkr(listing.price * rentalDuration * getExchangeRate())}
                      </span>
                  </p>
                </div>
              )}

              {/* Payment breakdown */}
              <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {listing.type === "RENT"
                      ? `Rental fee (${rentalDuration} ${listing.rentalPeriod === "PER_HOUR" ? "hr" : "day"}${rentalDuration > 1 ? "s" : ""})`
                      : "Item price"}
                  </span>
                  <span className="font-medium">
                    {formatPkr(listing.price * (listing.type === "RENT" ? rentalDuration : 1) * getExchangeRate())}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({formatUsd(listing.price * (listing.type === "RENT" ? rentalDuration : 1))})
                    </span>
                  </span>
                </div>
                {listing.type === "RENT" && listing.depositAmountUsd ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Security deposit (refundable)</span>
                    <span className="font-medium">
                      {formatPkr(listing.depositAmountUsd * getExchangeRate())}
                      <span className="text-xs text-muted-foreground ml-1">({formatUsd(listing.depositAmountUsd)})</span>
                    </span>
                  </div>
                ) : listing.type === "RENT" ? (
                  <p className="text-xs text-green-600">✓ No security deposit — rental fee released automatically when you return the item</p>
                ) : null}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total charged to card</span>
                  <span>
                    {formatPkr((listing.price * (listing.type === "RENT" ? rentalDuration : 1) + (listing.depositAmountUsd || 0)) * getExchangeRate())}
                    <span className="text-xs text-muted-foreground font-normal ml-1">
                      ({formatUsd(listing.price * (listing.type === "RENT" ? rentalDuration : 1) + (listing.depositAmountUsd || 0))})
                    </span>
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Funds held in escrow · Stripe processes in USD
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment section — switches from "Proceed" button to actual Stripe card form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {clientSecret ? (
            // Step 2: real Stripe card input, wrapped in Elements with the clientSecret
            <Elements stripe={getStripe()} options={{ clientSecret }}>
              <StripePaymentForm
                clientSecret={clientSecret}
                amount={usdToPkr(Math.round((listing.price * (listing.type === "RENT" ? rentalDuration : 1) + (listing.depositAmountUsd || 0)) * 100))}
                onSuccess={handlePaymentSuccess}
                onError={(msg) => toast.error(msg)}
              />
            </Elements>
          ) : (
            // Step 1: show escrow info and "Proceed to Payment" button
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Secure Escrow Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Shield className="h-8 w-8 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-700 dark:text-green-400">Funds held in escrow</p>
                    <p className="text-sm text-green-600/80">
                      Your payment is held securely until you confirm receipt of the item.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleCreatePaymentIntent}
                  className="w-full h-12 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Preparing payment...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-5 w-5" />
                      Proceed to Payment — {formatPkr((listing.price * (listing.type === "RENT" ? rentalDuration : 1) + (listing.depositAmountUsd || 0)) * getExchangeRate())}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div className="p-4 rounded-lg bg-muted/50">
            <Lock className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="font-medium">Secure Payment</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="font-medium">Buyer Protection</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <Check className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="font-medium">Escrow Guarantee</p>
          </div>
        </div>

        <VerificationRequiredModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          actionType={listing.type === "RENT" ? "rent" : "buy"}
        />
      </div>
    </div>
  )
}

export default function NewTransactionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <NewTransactionContent />
    </Suspense>
  )
}
