"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Package, Search, Filter, Eye, Trash2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { listingAPI } from "@/lib/api"
import { formatPkr, getExchangeRate } from "@/lib/currency"
import { toast } from "sonner"
import { formatDistanceToNow, isValid } from "date-fns"

// GET /listings returns raw image paths (e.g. /uploads/abc.jpg).
// Prefix them with the Spring Boot origin so they resolve correctly
// from the Next.js frontend (different port / host).
const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api").replace(/\/api\/?$/, "")
const resolveImageUrl = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined
  if (raw.startsWith("http")) return raw
  return `${BACKEND_ORIGIN}${raw}`
}

const safeDistanceToNow = (dateStr: string | null | undefined): string => {
  if (!dateStr) return ""
  try {
    const d = new Date(dateStr)
    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : ""
  } catch {
    return ""
  }
}
import Link from "next/link"

interface Listing {
  id: string
  title: string
  description: string
  price: number
  category: string
  condition: string
  status: string
  imageUrls?: string[]
  images?: string[]
  imageUrl?: string
  sellerId?: string
  sellerName?: string
  seller?: {
    id: string
    username: string
    email: string
  }
  createdAt: string
}

export default function AdminListingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [listings, setListings] = useState<Listing[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchListings()
  }, [page, statusFilter])

  const fetchListings = async () => {
    setIsLoading(true)
    try {
      // Use the centralized listingAPI which works with real backend
      const response = await listingAPI.getAll({
        page,
        size: 10,
        sortBy: "createdAt",
        sortDir: "desc",
      })
      // Handle both paginated response and direct array response
      const listingsData = response.data.content || response.data || []
      setListings(Array.isArray(listingsData) ? listingsData : [])
      setTotalPages(response.data.totalPages || 1)
    } catch (error) {
      console.error("Failed to fetch listings:", error)
      toast.error("Failed to fetch listings")
      setListings([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteListing = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return
    try {
      await listingAPI.delete(id)
      toast.success("Listing deleted")
      fetchListings()
    } catch (error) {
      toast.error("Failed to delete listing")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/10 text-green-600"
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-600"
      case "SOLD":
        return "bg-blue-500/10 text-blue-600"
      case "REJECTED":
        return "bg-red-500/10 text-red-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const filteredListings = listings.filter((listing) => {
    const sellerName = listing.seller?.username || listing.sellerName || ""
    return (
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sellerName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
            <span className="truncate">Manage Listings</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Review and manage all marketplace listings</p>
        </div>
        <Button
          onClick={fetchListings}
          variant="outline"
          size="sm"
          className="gap-2 bg-transparent self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search listings..."
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
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SOLD">Sold</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings - Card layout */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">All Listings</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Manage marketplace listings</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {isLoading ? (
            <div className="space-y-3 sm:space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-28 sm:h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredListings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 sm:p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex-shrink-0">
                      <AvatarImage
                        src={
                          resolveImageUrl(listing.imageUrls?.[0]) ||
                          resolveImageUrl(listing.images?.[0]) ||
                          resolveImageUrl(listing.imageUrl) ||
                          "/placeholder.svg"
                        }
                        alt={listing.title}
                      />
                      <AvatarFallback className="rounded-lg text-xs">{listing.title[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{listing.title}</p>
                          <p className="text-xs text-muted-foreground">{listing.category}</p>
                        </div>
                        <Badge className={`${getStatusColor(listing.status)} text-[10px] sm:text-xs flex-shrink-0`}>
                          {listing.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div>
                      <span className="text-muted-foreground">Seller: </span>
                      <span className="truncate">{listing.seller?.username || listing.sellerName || "Unknown"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price: </span>
                      <span className="font-medium">{formatPkr(listing.price * getExchangeRate())}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {safeDistanceToNow(listing.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" asChild className="h-7 w-7 p-0">
                        <Link href={`/admin/listings/${listing.id}`}>
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteListing(listing.id)}
                        className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
