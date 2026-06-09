"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Heart,
  MessageSquare,
  Share2,
  ShoppingCart,
  Calendar,
  User,
  Shield,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BackButton } from "@/components/back-button"
import { VerificationRequiredModal } from "@/components/verification-required-modal"
import { useAuth } from "@/context/auth-context"
import { listingAPI, cnicAPI } from "@/lib/api"
import { formatPkr, getExchangeRate } from "@/lib/currency"
import { createChat } from "@/services/chat/chatApi"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Listing {
  id?: string  // Backend returns id for getById (full entity)
  title: string
  description: string
  price: number
  type: "SALE" | "RENT"
  status?: "ACTIVE" | "SOLD" | "RENTED" | "REMOVED"
  category: string
  // Different endpoints return images in different field names:
  imageUrls?: string[]  // /listings/rent and /listings/sell use this
  images?: string[]     // /listings/{id} might use this
  imageUrl?: string     // Single image URL from some endpoints
  createdAt?: string | number  // Backend returns Instant (can be epoch or ISO string)
  userId?: string
  ownerId?: string    // Backend uses ownerId for ownership (MongoDB ObjectId)
  sellerEmail?: string // Backend resolves and returns seller email for ownership check
  seller?: {
    id: string
    username: string
    email: string
    profileImage?: string
  }
}

// Helper to get images from listing (handles different field names from different endpoints)
const getListingImages = (listing: Listing | null): string[] => {
  if (!listing) return []
  // Backend returns images in different field names depending on endpoint:
  // - /listings/rent and /listings/sell return imageUrls (array)
  // - /listings/{id} might return images, imageUrl, or other field names
  // Try all possible field names in order of preference
  const images = listing.imageUrls || listing.images || (listing.imageUrl ? [listing.imageUrl] : [])
  console.log("[v0] getListingImages - listing object:", { 
    title: listing.title, 
    imageUrls: listing.imageUrls?.length || 0,
    images: listing.images?.length || 0,
    imageUrl: listing.imageUrl ? "has single URL" : "none",
    resolvedImages: images.length
  })
  return images
}

// Helper to build full image URL from relative path
// Backend returns S3 URLs like "https://trustify-backend-images.s3.ap-south-1.amazonaws.com/..."
const PLACEHOLDER_IMAGE = "https://placehold.co/600x600/1a1a2e/ffffff?text=No+Image"

const getFullImageUrl = (url: string | undefined): string => {
  if (!url) {
    return PLACEHOLDER_IMAGE
  }
  // If already a full URL (starts with http), return as-is
  if (url.startsWith("http")) {
    return url
  }
  // If it's a data URL, return as-is
  if (url.startsWith("data:")) {
    return url
  }
  // If it's a relative path, prepend API base URL
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
  const imageBaseUrl = baseUrl.replace(/\/api$/, "")
  return `${imageBaseUrl}${url.startsWith("/") ? url : "/" + url}`
}

// Helper to format date from backend (handles Instant epoch or ISO string)
const formatDate = (date: string | number | undefined): string => {
  if (!date) return "Recently listed"
  try {
    // If it's a number (epoch milliseconds or seconds)
    if (typeof date === "number") {
      // Java Instant can be seconds or milliseconds - check magnitude
      const timestamp = date > 10000000000 ? date : date * 1000
      return new Date(timestamp).toLocaleDateString()
    }
    // If it's a string, try parsing as ISO or epoch string
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) {
      // Try parsing as epoch string
      const epochNum = parseInt(date, 10)
      if (!isNaN(epochNum)) {
        const timestamp = epochNum > 10000000000 ? epochNum : epochNum * 1000
        return new Date(timestamp).toLocaleDateString()
      }
      return "Recently listed"
    }
    return parsed.toLocaleDateString()
  } catch {
    return "Recently listed"
  }
}

export default function ListingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const listingId = params.id as string  // Store the ID from URL - this is our source of truth
  const [listing, setListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)

  useEffect(() => {
    if (listingId) {
      fetchListing(listingId)
    }
    checkVerificationStatus()
  }, [listingId])

  const checkVerificationStatus = async () => {
    try {
      const response = await cnicAPI.isVerified()
      setIsVerified(response.data.verified)
    } catch (error) {
      console.error("Failed to check verification status:", error)
      setIsVerified(false)
    }
  }

  const fetchListing = async (id: string) => {
    try {
      const response = await listingAPI.getById(id)
      // Log the full response to debug image field names and owner info
      console.log("[v0] Listing API response:", JSON.stringify(response.data, null, 2))
      console.log("[v0] Owner fields - ownerId:", response.data?.ownerId, "userId:", response.data?.userId, "seller:", response.data?.seller)
      setListing(response.data)
    } catch (error) {
      console.error("Failed to fetch listing:", error)
      toast.error("Failed to load listing")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!listingId) return
    try {
      await listingAPI.toggleFavorite(listingId)
      setIsFavorited(!isFavorited)
      toast.success(isFavorited ? "Removed from favorites" : "Added to favorites")
    } catch (error) {
      toast.error("Failed to update favorite")
    }
  }

  const handleStartChat = async () => {
    if (!listing || !user) return
    
    // Prevent user from chatting with themselves (listing owner)
    if (isOwner) {
      toast.error("You cannot perform this action on your own listing")
      return
    }
    
    try {
      // Backend uses ownerId for the seller/owner of the listing
      const sellerId = listing.ownerId || listing.userId || listing.seller?.id
      console.log("[v0] Starting chat - listing data:", { ownerId: listing.ownerId, userId: listing.userId, sellerId: listing.seller?.id })
      if (!sellerId) {
        toast.error("Seller information not available")
        return
      }
      const response = await createChat([user.id || user.email, sellerId])
      router.push(`/chat/${response.data.id}`)
    } catch (error) {
      console.error("[v0] Failed to start chat:", error)
      toast.error("Failed to start chat")
    }
  }

  const handleDelete = async () => {
    if (!listingId) return
    try {
      await listingAPI.delete(listingId)
      toast.success("Listing deleted successfully")
      router.push("/my-listings")
    } catch (error) {
      toast.error("Failed to delete listing")
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing?.title,
        text: listing?.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard")
    }
  }

  const handleBuyOrRent = () => {
    if (!listing || !listingId) return
    
    // Prevent user from buying/renting their own listing
    if (isOwner) {
      toast.error("You cannot perform this action on your own listing")
      return
    }
    
    // Check if user is verified before allowing purchase/rent
    if (!isVerified) {
      setShowVerificationModal(true)
      return
    }
    
    // Pass sellerId in URL — belt-and-suspenders in case GET /listings/{id} still omits ownerId
    const sellerId = listing?.ownerId || listing?.seller?.id || ""
    const sellerParam = sellerId ? `&sellerId=${sellerId}` : ""
    router.push(`/transactions/new?listingId=${listingId}${sellerParam}`)
  }

  const nextImage = () => {
    if (listing?.imageUrls) {
      setCurrentImageIndex((prev) => (prev === listing.imageUrls.length - 1 ? 0 : prev + 1))
    }
  }

  const prevImage = () => {
    if (listing?.imageUrls) {
      setCurrentImageIndex((prev) => (prev === 0 ? listing.imageUrls.length - 1 : prev - 1))
    }
  }

  // Check ownership:
  // 1. user.id (ObjectId) vs listing.ownerId — the reliable match when both are present
  // 2. user.email vs listing.sellerEmail — backend resolves ownerId → email, works even
  //    when user.id is empty (e.g. logged in during mock-mode with no id stored)
  // 3. Fallback: user.email vs embedded seller object email (legacy)
  const isOwner = Boolean(
    user &&
    listing &&
    (
      (user.id && listing.ownerId && (user.id === listing.ownerId || user.id === listing.userId)) ||
      (user.email && listing.sellerEmail && user.email === listing.sellerEmail) ||
      (user.email && listing.seller?.email && user.email === listing.seller.email)
    )
  )

  if (isLoading) {
    return (
      <div className="p-4 md:p-5 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-6 md:h-7 lg:h-8 w-40 md:w-44 lg:w-48 mb-4 md:mb-5 lg:mb-6" />
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-5 lg:gap-8">
            <Skeleton className="aspect-square md:aspect-[16/10] md:max-h-[280px] lg:aspect-square lg:max-h-none rounded-xl" />
            <div className="space-y-3 md:space-y-3 lg:space-y-4">
              <Skeleton className="h-8 md:h-7 lg:h-10 w-3/4" />
              <Skeleton className="h-5 md:h-4 lg:h-6 w-1/4" />
              <Skeleton className="h-6 md:h-6 lg:h-8 w-1/3" />
              <Skeleton className="h-24 md:h-20 lg:h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="p-6 md:p-6 lg:p-8 text-center">
        <h2 className="text-xl md:text-xl lg:text-2xl font-bold mb-4">Listing not found</h2>
        <Link href="/listings">
          <Button>Back to Listings</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-5 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-5 lg:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-3 lg:gap-4">
            <BackButton fallbackUrl="/listings" />
            <h1 className="text-base md:text-lg lg:text-xl font-semibold">Listing Details</h1>
          </div>
          <div className="flex items-center gap-1 md:gap-1 lg:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              className="h-8 w-8 md:h-8 md:w-8 lg:h-10 lg:w-10"
            >
              <Heart
                className={`h-4 w-4 md:h-4 md:w-4 lg:h-5 lg:w-5 ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
              />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8 md:h-8 md:w-8 lg:h-10 lg:w-10">
              <Share2 className="h-4 w-4 md:h-4 md:w-4 lg:h-5 lg:w-5" />
            </Button>
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-8 w-8 md:h-8 md:w-8 lg:h-10 lg:w-10"
                  >
                    <Trash2 className="h-4 w-4 md:h-3.5 md:w-3.5 lg:h-5 lg:w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this listing? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-5 lg:gap-8">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-2 md:space-y-2 lg:space-y-4"
          >
            <div className="relative aspect-square md:aspect-[16/10] md:max-h-[280px] lg:aspect-square lg:max-h-none rounded-xl overflow-hidden bg-muted group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={listing ? getFullImageUrl(getListingImages(listing)[currentImageIndex]) : PLACEHOLDER_IMAGE}
                alt={listing?.title || "Listing image"}
                className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-300 ease-in-out"
                onLoad={() => console.log("[v0] Image loaded successfully:", listing ? getListingImages(listing)[currentImageIndex] : "N/A")}
                onError={(e) => {
                  const img = e.target as HTMLImageElement
                  console.log("[v0] Image failed to load. Attempted URL:", img.src)
                  if (listing) {
                    console.log("[v0] Listing images array:", getListingImages(listing))
                  }
                  if (!img.src.includes("placehold.co")) {
                    img.src = PLACEHOLDER_IMAGE
                  }
                }}
              />
              {getListingImages(listing).length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 md:p-1 lg:p-2 rounded-full bg-background/80 hover:bg-background"
                  >
                    <ChevronLeft className="h-4 w-4 md:h-3.5 md:w-3.5 lg:h-5 lg:w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 md:p-1 lg:p-2 rounded-full bg-background/80 hover:bg-background"
                  >
                    <ChevronRight className="h-4 w-4 md:h-3.5 md:w-3.5 lg:h-5 lg:w-5" />
                  </button>
                </>
              )}
              <Badge
                className={`absolute top-2 md:top-2 lg:top-4 left-2 md:left-2 lg:left-4 text-[10px] md:text-[10px] lg:text-sm px-1.5 md:px-1.5 lg:px-2.5 py-0.5 ${
                  listing.type === "RENT" ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                }`}
              >
                {listing.type === "RENT" ? "For Rent" : "For Sale"}
              </Badge>
              {listing.status === "SOLD" && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-2xl md:text-xl lg:text-3xl tracking-widest rotate-[-15deg] border-4 border-white px-4 py-1 rounded">
                    SOLD
                  </span>
                </div>
              )}
              {listing.status === "RENTED" && (
                <div className="absolute inset-0 bg-amber-900/40 flex items-center justify-center">
                  <span className="text-white font-bold text-lg md:text-base lg:text-2xl tracking-widest rotate-[-15deg] border-4 border-amber-300 px-3 py-1 rounded text-center">
                    RENTED
                  </span>
                </div>
              )}
            </div>

            {getListingImages(listing).length > 1 && (
              <div className="flex gap-1 md:gap-1 lg:gap-2 overflow-x-auto pb-2">
                {getListingImages(listing).map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-12 h-12 md:w-10 md:h-10 lg:w-20 lg:h-20 rounded-md md:rounded-md lg:rounded-lg overflow-hidden flex-shrink-0 ${
                      index === currentImageIndex ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={getFullImageUrl(url)} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        const img = e.target as HTMLImageElement
                        if (!img.src.includes("placehold.co")) {
                          img.src = PLACEHOLDER_IMAGE
                        }
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-3 md:space-y-3 lg:space-y-6"
          >
            <div>
              <h1 className="text-xl md:text-lg lg:text-3xl font-bold text-foreground mb-1.5 md:mb-1 lg:mb-2">
                {listing.title}
              </h1>
              <div className="flex items-center gap-2 md:gap-2 lg:gap-4 text-xs md:text-[11px] lg:text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 md:h-3 md:w-3 lg:h-4 lg:w-4" />
                  {formatDate(listing.createdAt)}
                </span>
                <Badge variant="secondary" className="text-[10px] md:text-[10px] lg:text-xs">
                  {listing.category}
                </Badge>
                {listing.status === "SOLD" && (
                  <Badge className="text-[10px] md:text-[10px] lg:text-xs bg-red-600 text-white">
                    Sold Out
                  </Badge>
                )}
                {listing.status === "RENTED" && (
                  <Badge className="text-[10px] md:text-[10px] lg:text-xs bg-amber-500 text-white">
                    Currently Rented
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-xl md:text-lg lg:text-3xl font-bold text-primary">
              {formatPkr(listing.price * getExchangeRate())}
              {listing.type === "RENT" && (
                <span className="text-xs md:text-xs lg:text-lg font-normal text-muted-foreground">
                  /{(listing as any).rentalPeriod === "PER_HOUR" ? "hr" : "day"}
                </span>
              )}
            </div>

            <Card>
              <CardContent className="p-2.5 md:p-2.5 lg:p-4">
                <h3 className="font-semibold mb-1.5 md:mb-1 lg:mb-2 text-xs md:text-xs lg:text-base">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap text-xs md:text-[11px] lg:text-sm leading-relaxed md:leading-normal lg:leading-relaxed md:max-h-[80px] md:overflow-y-auto lg:max-h-none">
                  {listing.description}
                </p>
              </CardContent>
            </Card>

            {/* Seller Info - More compact for tablet */}
            <Card>
              <CardContent className="p-2.5 md:p-2.5 lg:p-4">
                <h3 className="font-semibold mb-2 md:mb-2 lg:mb-4 text-xs md:text-xs lg:text-base">
                  Seller Information
                </h3>
                <div className="flex items-center gap-2 md:gap-2 lg:gap-4">
                  <Avatar className="h-9 w-9 md:h-8 md:w-8 lg:h-12 lg:w-12">
                    <AvatarImage src={listing.seller?.profileImage || "/placeholder.svg"} />
                    <AvatarFallback>
                      <User className="h-4 w-4 md:h-4 md:w-4 lg:h-6 lg:w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-xs md:text-xs lg:text-base">
                      {listing.seller?.username || "Seller"}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] md:text-[10px] lg:text-sm text-muted-foreground">
                      <Shield className="h-2.5 w-2.5 md:h-2.5 md:w-2.5 lg:h-3 lg:w-3 text-green-500" />
                      Verified User
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons - More compact for tablet */}
            {!isOwner && (
              <div className="flex flex-col sm:flex-row gap-2 md:gap-1.5 lg:gap-3">
                {listing.status === "SOLD" ? (
                  <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-muted border text-sm text-muted-foreground font-medium">
                    <ShoppingCart className="h-4 w-4 opacity-50" />
                    This item has been sold
                  </div>
                ) : listing.status === "RENTED" ? (
                  <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300 font-medium">
                    <Calendar className="h-4 w-4" />
                    Currently rented out — check back later
                  </div>
                ) : (
                  <Button
                    className="flex-1 gap-1.5 md:gap-1 lg:gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-xs md:text-xs lg:text-base h-8 md:h-8 lg:h-10"
                    onClick={handleBuyOrRent}
                  >
                    <ShoppingCart className="h-3.5 w-3.5 md:h-3 md:w-3 lg:h-4 lg:w-4" />
                    {listing.type === "RENT" ? "Rent Now" : "Buy Now"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5 md:gap-1 lg:gap-2 bg-transparent text-xs md:text-xs lg:text-base h-8 md:h-8 lg:h-10"
                  onClick={handleStartChat}
                >
                  <MessageSquare className="h-3.5 w-3.5 md:h-3 md:w-3 lg:h-4 lg:w-4" />
                  Chat with Seller
                </Button>
              </div>
            )}

            {/* Ownership Indicator */}
            {isOwner && (
              <div className="flex items-center gap-2 md:gap-2 lg:gap-3 p-3 md:p-3 lg:p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm md:text-sm lg:text-base font-medium text-blue-900 dark:text-blue-100">
                    You are the owner of this listing
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Verification Required Modal */}
        <VerificationRequiredModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          actionType={listing.type === "RENT" ? "rent" : "buy"}
        />
      </div>
    </div>
  )
}
