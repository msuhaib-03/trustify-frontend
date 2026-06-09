"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  Search,
  Plus,
  TrendingUp,
  ShoppingBag,
  Laptop,
  Shirt,
  Sofa,
  MoreHorizontal,
  ArrowRight,
  Heart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BackButton } from "@/components/back-button"
import { useAuth } from "@/context/auth-context"
import { listingAPI } from "@/lib/api"
import { formatPkr, getExchangeRate } from "@/lib/currency"

interface Listing {
  id?: string  // Backend may not return id in DTO
  title: string
  description: string
  price: number
  type: "SALE" | "RENT"
  category: string
  imageUrls?: string[]
  createdAt?: string
}

// Helper to build full image URL from relative path
const PLACEHOLDER_IMAGE = "https://placehold.co/400x300/1a1a2e/ffffff?text=No+Image"

const getFullImageUrl = (url: string | undefined): string => {
  if (!url) return PLACEHOLDER_IMAGE
  if (url.startsWith("http")) return url
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
  const imageBaseUrl = baseUrl.replace(/\/api$/, "")
  return `${imageBaseUrl}${url}`
}

const categories = [
  { name: "Electronics", icon: Laptop, color: "bg-blue-500/10 text-blue-500" },
  { name: "Fashion", icon: Shirt, color: "bg-pink-500/10 text-pink-500" },
  { name: "Furniture", icon: Sofa, color: "bg-orange-500/10 text-orange-500" },
  { name: "More", icon: MoreHorizontal, color: "bg-gray-500/10 text-gray-500" },
]

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async () => {
    try {
      // Use getAllWithIds to get listings with IDs
      const response = await listingAPI.getAllWithIds({ page: 0, size: 8, sortBy: "createdAt", sortDir: "desc" })
      const data = response.data
      setListings(Array.isArray(data) ? data : data.content || [])
    } catch (error) {
      console.error("Failed to fetch listings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/listings?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="p-4 md:p-5 lg:p-8 space-y-6 md:space-y-7 lg:space-y-8">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <BackButton fallbackUrl="/" />
        <h1 className="text-xl md:text-2xl lg:text-2xl font-bold">Home</h1>
      </div>

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent p-5 md:p-6 lg:p-8"
      >
        <div className="absolute inset-0 bg-[url('/abstract-geometric-flow.png')] opacity-10" />
        <div className="relative z-10 space-y-3 md:space-y-3 lg:space-y-4">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary-foreground">
            Welcome back, {user?.username || "User"}!
          </h2>
          <p className="text-sm md:text-sm lg:text-base text-primary-foreground/80 max-w-xl">
            Discover amazing deals in your community. Buy, sell, or rent with confidence on Trustify.
          </p>
          <div className="flex flex-row gap-2 sm:gap-3">
            <Link href="/create-listing" className="flex-1 sm:flex-none">
              <Button variant="secondary" className="w-full sm:w-auto gap-2 text-xs sm:text-sm md:text-sm h-9 sm:h-10">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="whitespace-nowrap">Create Listing</span>
              </Button>
            </Link>
            <Link href="/listings" className="flex-1 sm:flex-none">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 gap-2 text-xs sm:text-sm md:text-sm h-9 sm:h-10"
              >
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="whitespace-nowrap">Browse All</span>
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 h-4 w-4 md:h-4 md:w-4 lg:h-5 lg:w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for items, categories, or sellers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 md:pl-11 lg:pl-12 pr-4 h-10 md:h-11 lg:h-12 text-sm md:text-sm lg:text-lg bg-muted/50"
        />
      </form>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-3 md:mb-3 lg:mb-4">
          <h3 className="text-base md:text-base lg:text-lg font-semibold">Categories</h3>
          <Link
            href="/listings"
            className="text-xs md:text-xs lg:text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3 md:h-3 md:w-3 lg:h-4 lg:w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-6 gap-3 md:gap-3 lg:gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/listings?category=${category.name}`}>
                <Card className="hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-3 md:p-3 lg:p-4 flex flex-col items-center gap-1.5 md:gap-1.5 lg:gap-2">
                    <div
                      className={`p-2 md:p-2 lg:p-3 rounded-xl ${category.color} group-hover:scale-110 transition-transform`}
                    >
                      <category.icon className="h-5 w-5 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                    </div>
                    <span className="text-xs md:text-xs lg:text-sm font-medium text-center">{category.name}</span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Latest Listings */}
      <section>
        <div className="flex items-center justify-between mb-3 md:mb-3 lg:mb-4">
          <h3 className="text-base md:text-base lg:text-lg font-semibold">Latest Listings</h3>
          <Link
            href="/listings"
            className="text-xs md:text-xs lg:text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3 md:h-3 md:w-3 lg:h-4 lg:w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-3 lg:gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] md:aspect-[16/9]" />
                <CardContent className="p-3 md:p-2.5 lg:p-4 space-y-2">
                  <Skeleton className="h-4 md:h-3.5 lg:h-5 w-3/4" />
                  <Skeleton className="h-3 md:h-3 lg:h-4 w-1/2" />
                  <Skeleton className="h-5 md:h-4 lg:h-6 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-3 lg:gap-4">
            {listings.map((listing, index) => (
              <motion.div
                key={listing.id || `listing-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {listing.id ? (
                <Link href={`/listings/${listing.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all group cursor-pointer">
                    <div className="relative aspect-[4/3] md:aspect-[16/9] lg:aspect-[4/3] bg-muted overflow-hidden">
                      <img
                        src={getFullImageUrl(listing.imageUrls?.[0])}
                        alt={listing.title}
                        className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-300 ease-in-out"
                      />
                      <Badge
                        className={`absolute top-2 left-2 text-[10px] md:text-[9px] lg:text-xs ${
                          listing.type === "RENT"
                            ? "bg-accent text-accent-foreground"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {listing.type === "RENT" ? "For Rent" : "For Sale"}
                      </Badge>
                      <button className="absolute top-2 right-2 p-1.5 md:p-1 lg:p-2 rounded-full bg-background/80 hover:bg-background transition-colors">
                        <Heart className="h-3.5 w-3.5 md:h-3 md:w-3 lg:h-4 lg:w-4" />
                      </button>
                    </div>
                    <CardContent className="p-3 md:p-2.5 lg:p-4 space-y-1 md:space-y-0.5 lg:space-y-2">
                      <h4 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors text-sm md:text-xs lg:text-base">
                        {listing.title}
                      </h4>
                      <p className="text-xs md:text-[10px] lg:text-sm text-muted-foreground line-clamp-1">
                        {listing.category}
                      </p>
                      <p className="text-base md:text-sm lg:text-lg font-bold text-primary">
                        {formatPkr(listing.price * getExchangeRate())}
                        {listing.type === "RENT" && (
                          <span className="text-[10px] md:text-[9px] lg:text-sm font-normal text-muted-foreground">
                            /{(listing as any).rentalPeriod === "PER_HOUR" ? "hr" : "day"}
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
                ) : (
                <Card className="overflow-hidden opacity-50">
                  <div className="relative aspect-[4/3] md:aspect-[16/9] lg:aspect-[4/3] bg-muted overflow-hidden">
                    <img
                      src={getFullImageUrl(listing.imageUrls?.[0])}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge
                      className={`absolute top-2 left-2 text-[10px] md:text-[9px] lg:text-xs ${
                        listing.type === "RENT"
                          ? "bg-accent text-accent-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {listing.type === "RENT" ? "For Rent" : "For Sale"}
                    </Badge>
                  </div>
                  <CardContent className="p-3 md:p-2.5 lg:p-4 space-y-1 md:space-y-0.5 lg:space-y-2">
                    <h4 className="font-semibold text-foreground line-clamp-1 text-sm md:text-xs lg:text-base">
                      {listing.title}
                    </h4>
                    <p className="text-xs md:text-[10px] lg:text-sm text-muted-foreground line-clamp-1">
                      {listing.category}
                    </p>
                    <p className="text-base md:text-sm lg:text-lg font-bold text-primary">
                      {formatPkr(listing.price * getExchangeRate())}
                    </p>
                  </CardContent>
                </Card>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="p-8 md:p-10 lg:p-12 text-center">
            <ShoppingBag className="h-10 md:h-10 lg:h-12 w-10 md:w-10 lg:w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="text-base md:text-base lg:text-lg font-semibold mb-2">No listings yet</h4>
            <p className="text-sm text-muted-foreground mb-4">Be the first to create a listing!</p>
            <Link href="/create-listing">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Listing
              </Button>
            </Link>
          </Card>
        )}
      </section>

      {/* Promo Banners */}
      <section className="grid md:grid-cols-2 gap-3 md:gap-3 lg:gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardContent className="p-4 md:p-4 lg:p-6 flex items-center gap-3 md:gap-3 lg:gap-4">
              <div className="p-3 md:p-3 lg:p-4 rounded-xl bg-blue-500/20">
                <ShoppingBag className="h-6 w-6 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm md:text-sm lg:text-base">Safe & Secure</h4>
                <p className="text-xs md:text-xs lg:text-sm text-muted-foreground">
                  All transactions protected by escrow
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border-green-500/20">
            <CardContent className="p-4 md:p-4 lg:p-6 flex items-center gap-3 md:gap-3 lg:gap-4">
              <div className="p-3 md:p-3 lg:p-4 rounded-xl bg-green-500/20">
                <TrendingUp className="h-6 w-6 md:h-6 md:w-6 lg:h-8 lg:w-8 text-green-500" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm md:text-sm lg:text-base">Verified Users</h4>
                <p className="text-xs md:text-xs lg:text-sm text-muted-foreground">Trade with confidence</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  )
}
