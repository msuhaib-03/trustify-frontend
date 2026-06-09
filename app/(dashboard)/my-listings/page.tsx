"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Plus, Trash2, Eye, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/back-button"
import { listingAPI } from "@/lib/api"
import { toast } from "sonner"
import { formatPkr, getExchangeRate } from "@/lib/currency"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Listing {
  id: string
  title: string
  description: string
  price: number
  type: "SALE" | "RENT"
  category: string
  imageUrls: string[]
  createdAt: string
}

// Helper to build full image URL from relative path
// Backend returns S3 URLs or relative paths
const PLACEHOLDER_IMAGE = "https://placehold.co/400x300/1a1a2e/ffffff?text=No+Image"

const getFullImageUrl = (url: string | undefined): string => {
  if (!url) return PLACEHOLDER_IMAGE
  // If already a full URL (starts with http), return as-is
  if (url.startsWith("http")) return url
  // If it's a relative path, prepend API base URL
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
  const imageBaseUrl = baseUrl.replace(/\/api$/, "")
  return `${imageBaseUrl}${url}`
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchMyListings()
  }, [])

  const fetchMyListings = async () => {
    try {
      // Use getMine endpoint which returns full Listing objects with ID
      const response = await listingAPI.getMine({ page: 0, size: 50 })
      setListings(response.data.content || response.data || [])
    } catch (error) {
      console.error("Failed to fetch listings:", error)
      toast.error("Failed to load your listings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await listingAPI.delete(deleteId)
      setListings(listings.filter((l) => l.id !== deleteId))
      toast.success("Listing deleted successfully")
    } catch (error) {
      toast.error("Failed to delete listing")
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton fallbackUrl="/home" />
          <h1 className="text-2xl font-bold">My Listings</h1>
        </div>
        <Link href="/create-listing">
          <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <Plus className="h-4 w-4" />
            Create New
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3]" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden group">
                <div className="relative aspect-[4/3] bg-muted">
                  <img
                    src={getFullImageUrl(listing.imageUrls?.[0])}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge
                    className={`absolute top-2 left-2 ${
                      listing.type === "RENT"
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {listing.type === "RENT" ? "For Rent" : "For Sale"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/listings/${listing.id}`} className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteId(listing.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-semibold line-clamp-1">{listing.title}</h4>
                  <p className="text-sm text-muted-foreground">{listing.category}</p>
                  <p className="text-lg font-bold text-primary">
                    {formatPkr(listing.price * getExchangeRate())}
                    {listing.type === "RENT" && <span className="text-sm font-normal text-muted-foreground">/{(listing as any).rentalPeriod === "PER_HOUR" ? "hr" : "day"}</span>}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <h4 className="text-lg font-semibold mb-2">No listings yet</h4>
          <p className="text-muted-foreground mb-4">Start selling or renting by creating your first listing!</p>
          <Link href="/create-listing">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Listing
            </Button>
          </Link>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
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
    </div>
  )
}
