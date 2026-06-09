"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Heart, HeartOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/back-button"
import { listingAPI } from "@/lib/api"
import { toast } from "sonner"
import { formatPkr, getExchangeRate } from "@/lib/currency"

interface Listing {
  id: string
  title: string
  description: string
  price: number
  type: "SALE" | "RENT"
  category: string
  imageUrls: string[]
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const response = await listingAPI.getFavorites()
      setFavorites(response.data || [])
    } catch (error) {
      console.error("Failed to fetch favorites:", error)
      toast.error("Failed to load favorites")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFavorite = async (listingId: string) => {
    try {
      await listingAPI.toggleFavorite(listingId)
      setFavorites(favorites.filter((f) => f.id !== listingId))
      toast.success("Removed from favorites")
    } catch (error) {
      toast.error("Failed to remove from favorites")
    }
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton fallbackUrl="/home" />
        <h1 className="text-2xl font-bold">My Favorites</h1>
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
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favorites.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/listings/${listing.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-all group cursor-pointer">
                  <div className="relative aspect-[4/3] bg-muted">
                    <img
                      src={listing.imageUrls?.[0] || "/placeholder.svg?height=300&width=400&query=product"}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                    <button
                      className="absolute top-2 right-2 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                      onClick={(e) => {
                        e.preventDefault()
                        handleRemoveFavorite(listing.id)
                      }}
                    >
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </button>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {listing.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{listing.category}</p>
                    <p className="text-lg font-bold text-primary">
                      {formatPkr(listing.price * getExchangeRate())}
                      {listing.type === "RENT" && (
                        <span className="text-sm font-normal text-muted-foreground">/{(listing as any).rentalPeriod === "PER_HOUR" ? "hr" : "day"}</span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <HeartOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="text-lg font-semibold mb-2">No favorites yet</h4>
          <p className="text-muted-foreground mb-4">Start exploring and save items you love!</p>
          <Link href="/listings">
            <Button>Browse Listings</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
