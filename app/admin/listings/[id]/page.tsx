"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  Package,
  ArrowLeft,
  RefreshCw,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  ImageIcon,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { listingAPI } from "@/lib/api"
import { format, isValid, parseISO } from "date-fns"
import { formatPkr, getExchangeRate } from "@/lib/currency"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

interface Listing {
  id: string
  title: string
  description: string
  price: number
  category: string
  condition: string
  status: string
  images?: string[]
  imageUrls?: string[]
  type?: "SALE" | "RENT"
  sellerId?: string
  sellerName?: string
  sellerImage?: string
  seller?: {
    id: string
    username: string
    email: string
    profileImage?: string
  }
  location?: string
  createdAt: string
  updatedAt?: string
  userId?: string
}

const statusConfig: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: "bg-green-500/10 text-green-600 border-green-500/20", label: "Active" },
  PENDING: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", label: "Pending Review" },
  SOLD: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Sold" },
  REJECTED: { color: "bg-red-500/10 text-red-600 border-red-500/20", label: "Rejected" },
}

const conditionConfig: Record<string, string> = {
  NEW: "Brand New",
  LIKE_NEW: "Like New",
  GOOD: "Good",
  FAIR: "Fair",
}

function formatDate(dateValue: string | undefined | null, formatStr: string): string {
  if (!dateValue) return "-"
  try {
    const date = typeof dateValue === "string" ? parseISO(dateValue) : new Date(dateValue)
    if (!isValid(date)) return "-"
    return format(date, formatStr)
  } catch {
    return "-"
  }
}

function AdminListingDetailsContent() {
  const params = useParams()
  const [listing, setListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    if (params.id) {
      fetchListing(params.id as string)
    }
  }, [params.id])

  const fetchListing = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await listingAPI.getById(id)
      setListing(response.data)
    } catch (error) {
      console.error("Failed to fetch listing:", error)
      toast.error("Failed to fetch listing details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveListing = async () => {
    if (!listing) return
    try {
      toast.success("Listing approved successfully")
      fetchListing(listing.id)
    } catch (error) {
      toast.error("Failed to approve listing")
    }
  }

  const handleRejectListing = async () => {
    if (!listing) return
    try {
      toast.success("Listing rejected")
      fetchListing(listing.id)
    } catch (error) {
      toast.error("Failed to reject listing")
    }
  }

  const handleDeleteListing = async () => {
    if (!listing) return
    if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) return
    try {
      await listingAPI.delete(listing.id)
      toast.success("Listing deleted successfully")
      window.location.href = "/admin/listings"
    } catch (error) {
      toast.error("Failed to delete listing")
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-6 overflow-x-hidden max-w-full">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Listing not found</h2>
        <p className="text-muted-foreground mb-4">
          The listing you are looking for does not exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/admin/listings">Back to Listings</Link>
        </Button>
      </div>
    )
  }

  const statusInfo = statusConfig[listing.status] || statusConfig.ACTIVE
  const rawImages = (listing.imageUrls || listing.images || []).filter(
    (url): url is string => typeof url === "string" && url.trim().length > 0
  )
  const images = rawImages.length > 0 ? rawImages : ["/placeholder.svg"]
  const sellerName = listing.seller?.username || listing.sellerName || "Unknown Seller"
  const sellerImage = listing.seller?.profileImage || listing.sellerImage

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9">
            <Link href="/admin/listings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <span className="truncate">Listing Details</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono truncate">{listing.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button onClick={() => fetchListing(listing.id)} variant="outline" size="sm" className="gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Status & Actions Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-2 ${statusInfo.color}`}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 sm:p-4 rounded-xl ${statusInfo.color}`}>
                  <Package className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                  <h3 className="text-xl sm:text-2xl font-bold">{statusInfo.label}</h3>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {listing.status === "PENDING" && (
                  <>
                    <Button onClick={handleApproveListing} size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button onClick={handleRejectListing} size="sm" variant="destructive" className="gap-2">
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  onClick={handleDeleteListing}
                  size="sm"
                  variant="outline"
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Images */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="h-full">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                Product Images
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-4">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={images[selectedImage] || "/placeholder.svg"}
                    alt={listing.title || "Listing image"}
                    fill
                    className="object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                          selectedImage === index ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <Image
                          src={img || "/placeholder.svg"}
                          alt={`${listing.title || "Listing"} thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Listing Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Listing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold">{listing.title || "Untitled Listing"}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline">{listing.type === "RENT" ? "For Rent" : "For Sale"}</Badge>
                  {listing.category && <Badge variant="secondary">{listing.category}</Badge>}
                  {listing.condition && (
                    <Badge variant="secondary">{conditionConfig[listing.condition] || listing.condition}</Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Price
                  </p>
                  <p className="font-bold text-lg text-primary">
                    {typeof listing.price === "number" ? formatPkr(listing.price * getExchangeRate()) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Category
                  </p>
                  <p className="text-sm font-medium">{listing.category || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Listed
                  </p>
                  <p className="text-sm">{formatDate(listing.createdAt, "PPP")}</p>
                </div>
                {listing.location && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location
                    </p>
                    <p className="text-sm">{listing.location}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-sm leading-relaxed">{listing.description || "No description provided."}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Seller Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              Seller Information
            </CardTitle>
            <CardDescription>Details about the listing owner</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
                <AvatarImage src={sellerImage || "/placeholder.svg"} alt={sellerName} />
                <AvatarFallback className="text-lg">{sellerName[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base sm:text-lg truncate">{sellerName}</p>
                {listing.seller?.email && (
                  <p className="text-sm text-muted-foreground truncate">{listing.seller.email}</p>
                )}
                <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                  ID: {listing.userId || listing.seller?.id || listing.sellerId || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Metadata */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Metadata</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg border text-center">
                <p className="text-xs text-muted-foreground mb-1">Listing ID</p>
                <p className="font-mono text-xs truncate">{listing.id}</p>
              </div>
              <div className="p-3 rounded-lg border text-center">
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-sm">{formatDate(listing.createdAt, "PPp")}</p>
              </div>
              <div className="p-3 rounded-lg border text-center">
                <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm">{formatDate(listing.updatedAt, "PPp")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default function AdminListingDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6">
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <AdminListingDetailsContent />
    </Suspense>
  )
}
