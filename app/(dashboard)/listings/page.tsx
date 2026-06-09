"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Filter, Grid, List, Heart, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { BackButton } from "@/components/back-button"
import { listingAPI } from "@/lib/api"
import { toast } from "sonner"
import { formatPkr, getExchangeRate } from "@/lib/currency"

interface Listing {
  id?: string  // Backend may not return id in DTO - needs backend fix
  title: string
  description: string
  price: number
  type: "SALE" | "RENT"
  category: string
  imageUrls?: string[]
  createdAt?: string
  isFavorite?: boolean  // Backend returns this field
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

const categories = ["Electronics", "Fashion", "Furniture", "Sports", "Books", "Other"]

function ListingsContent() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get("search") || ""
  const initialCategory = searchParams.get("category") || ""

  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortDir, setSortDir] = useState("desc")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategory ? [initialCategory] : [])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchListings()
  }, [page, sortBy, sortDir])

  const fetchListings = async () => {
    setIsLoading(true)
    try {
      // Use getAllWithIds which fetches from /listings/rent and /listings/sell endpoints
      // These return full Listing objects with id field (unlike /listings which returns ListingDTO without id)
      const response = await listingAPI.getAllWithIds({
        page,
        size: 12,
        sortBy,
        sortDir,
      })
      const data = response.data
      // getAllWithIds returns a flat array, not paginated
      setListings(Array.isArray(data) ? data : data.content || [])
      setTotalPages(1) // Since we're combining two endpoints, pagination is handled differently
    } catch (error) {
      console.error("Failed to fetch listings:", error)
      toast.error("Failed to load listings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent, listingId: string | undefined) => {
    e.preventDefault()
    if (!listingId) {
      toast.error("Cannot favorite: listing ID not available")
      return
    }
    try {
      await listingAPI.toggleFavorite(listingId)
      toast.success("Favorite updated")
    } catch (error) {
      toast.error("Failed to update favorite")
    }
  }

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      !searchQuery ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(listing.category)

    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(listing.type)

    return matchesSearch && matchesCategory && matchesType
  })

  return (
    <div className="p-4 md:p-5 lg:p-8 space-y-4 md:space-y-5 lg:space-y-6 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex items-center gap-3 md:gap-3 lg:gap-4 min-w-0">
        <BackButton fallbackUrl="/home" />
        <h1 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-bold truncate">Browse Listings</h1>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 md:gap-3 lg:gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full h-9 md:h-10 lg:h-10 text-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[100px] sm:w-[120px] md:w-[110px] lg:w-[140px] flex-shrink-0 h-8 md:h-9 lg:h-10 text-xs md:text-xs lg:text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="title">Name</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortDir} onValueChange={setSortDir}>
            <SelectTrigger className="w-[80px] sm:w-[90px] md:w-[85px] lg:w-[100px] flex-shrink-0 h-8 md:h-9 lg:h-10 text-xs md:text-xs lg:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Desc</SelectItem>
              <SelectItem value="asc">Asc</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile/Tablet Filter Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden bg-transparent flex-shrink-0 h-8 w-8 md:h-9 md:w-9"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Categories</h4>
                  {categories.map((category) => (
                    <div key={category} className="flex items-center gap-2">
                      <Checkbox
                        id={`mobile-${category}`}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories([...selectedCategories, category])
                          } else {
                            setSelectedCategories(selectedCategories.filter((c) => c !== category))
                          }
                        }}
                      />
                      <Label htmlFor={`mobile-${category}`} className="text-sm">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Type</h4>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="mobile-sale"
                      checked={selectedTypes.includes("SALE")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTypes([...selectedTypes, "SALE"])
                        } else {
                          setSelectedTypes(selectedTypes.filter((t) => t !== "SALE"))
                        }
                      }}
                    />
                    <Label htmlFor="mobile-sale" className="text-sm">
                      For Sale
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="mobile-rent"
                      checked={selectedTypes.includes("RENT")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTypes([...selectedTypes, "RENT"])
                        } else {
                          setSelectedTypes(selectedTypes.filter((t) => t !== "RENT"))
                        }
                      }}
                    />
                    <Label htmlFor="mobile-rent" className="text-sm">
                      For Rent
                    </Label>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* View Toggle */}
          <div className="hidden sm:flex border rounded-lg flex-shrink-0">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 md:h-9 md:w-9"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 md:h-9 md:w-9"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 md:gap-5 lg:gap-6 overflow-hidden">
        {/* Desktop Sidebar Filters - Hidden on tablet */}
        <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6">
          <Card>
            <CardContent className="p-4 space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4" />
                  Categories
                </h4>
                {categories.map((category) => (
                  <div key={category} className="flex items-center gap-2">
                    <Checkbox
                      id={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([...selectedCategories, category])
                        } else {
                          setSelectedCategories(selectedCategories.filter((c) => c !== category))
                        }
                      }}
                    />
                    <Label htmlFor={category} className="text-sm cursor-pointer">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium text-sm">Type</h4>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sale"
                    checked={selectedTypes.includes("SALE")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTypes([...selectedTypes, "SALE"])
                      } else {
                        setSelectedTypes(selectedTypes.filter((t) => t !== "SALE"))
                      }
                    }}
                  />
                  <Label htmlFor="sale" className="text-sm cursor-pointer">
                    For Sale
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rent"
                    checked={selectedTypes.includes("RENT")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTypes([...selectedTypes, "RENT"])
                      } else {
                        setSelectedTypes(selectedTypes.filter((t) => t !== "RENT"))
                      }
                    }}
                  />
                  <Label htmlFor="rent" className="text-sm cursor-pointer">
                    For Rent
                  </Label>
                </div>
              </div>

              {(selectedCategories.length > 0 || selectedTypes.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSelectedCategories([])
                    setSelectedTypes([])
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Listings Grid/List */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-2.5 lg:gap-4"
                  : "space-y-3 md:space-y-2.5 lg:space-y-4"
              }
            >
              {[...Array(6)].map((_, i) => (
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
          ) : filteredListings.length > 0 ? (
            <>
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-2.5 lg:gap-4"
                    : "space-y-3 md:space-y-2.5 lg:space-y-4"
                }
              >
                {filteredListings.map((listing, index) => {
                  // Skip listings without ID (backend issue - ListingDTO should include id)
                  if (!listing.id) {
                    console.warn("[v0] Listing missing ID - backend ListingDTO should include id field:", listing.title)
                  }
                  
                  return (
                  <motion.div
                    key={listing.id || `listing-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {listing.id ? (
                    <Link href={`/listings/${listing.id}`}>
                      <Card
                        className={`overflow-hidden hover:shadow-lg transition-all group cursor-pointer ${
                          viewMode === "list" ? "flex" : ""
                        }`}
                      >
                        <div
                          className={`relative bg-muted ${viewMode === "list" ? "w-28 sm:w-40 md:w-32 lg:w-48 flex-shrink-0" : "aspect-[4/3] md:aspect-[16/9] lg:aspect-[4/3]"}`}
                        >
                          <img
                            src={getFullImageUrl(listing.imageUrls?.[0])}
                            alt={listing.title}
                            className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-300 ease-in-out"
                          />
                          <Badge
                            className={`absolute top-1.5 md:top-1 lg:top-2 left-1.5 md:left-1 lg:left-2 text-[10px] md:text-[9px] lg:text-xs ${
                              listing.type === "RENT"
                                ? "bg-accent text-accent-foreground"
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
                            {listing.type === "RENT" ? "For Rent" : "For Sale"}
                          </Badge>
                          <button
                            className="absolute top-1.5 md:top-1 lg:top-2 right-1.5 md:right-1 lg:right-2 p-1.5 md:p-1 lg:p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
                            onClick={(e) => handleToggleFavorite(e, listing.id)}
                          >
                            <Heart className={`h-3.5 w-3.5 md:h-3 md:w-3 lg:h-4 lg:w-4 ${listing.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                          </button>
                        </div>
                        <CardContent
                          className={`p-2.5 sm:p-3 md:p-2 lg:p-4 space-y-1 md:space-y-0.5 lg:space-y-2 min-w-0 ${viewMode === "list" ? "flex-1" : ""}`}
                        >
                          <h4 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors text-xs sm:text-sm md:text-xs lg:text-base">
                            {listing.title}
                          </h4>
                          {viewMode === "list" && (
                            <p className="text-xs md:text-[10px] lg:text-sm text-muted-foreground line-clamp-2">
                              {listing.description}
                            </p>
                          )}
                          <p className="text-[10px] sm:text-xs md:text-[10px] lg:text-sm text-muted-foreground truncate">
                            {listing.category}
                          </p>
                          <p className="text-sm sm:text-base md:text-sm lg:text-lg font-bold text-primary">
                            {formatPkr(listing.price * getExchangeRate())}
                            {listing.type === "RENT" && (
                              <span className="text-[9px] sm:text-xs md:text-[9px] lg:text-sm font-normal text-muted-foreground">
                                /day
                              </span>
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                    ) : (
                      <Card
                        className={`overflow-hidden opacity-50 ${
                          viewMode === "list" ? "flex" : ""
                        }`}
                      >
                        <div
                          className={`relative bg-muted ${viewMode === "list" ? "w-28 sm:w-40 md:w-32 lg:w-48 flex-shrink-0" : "aspect-[4/3] md:aspect-[16/9] lg:aspect-[4/3]"}`}
                        >
                          <img
                            src={getFullImageUrl(listing.imageUrls?.[0])}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                          <Badge
                            className={`absolute top-1.5 md:top-1 lg:top-2 left-1.5 md:left-1 lg:left-2 text-[10px] md:text-[9px] lg:text-xs ${
                              listing.type === "RENT"
                                ? "bg-accent text-accent-foreground"
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
                            {listing.type === "RENT" ? "For Rent" : "For Sale"}
                          </Badge>
                        </div>
                        <CardContent
                          className={`p-2.5 sm:p-3 md:p-2 lg:p-4 space-y-1 md:space-y-0.5 lg:space-y-2 min-w-0 ${viewMode === "list" ? "flex-1" : ""}`}
                        >
                          <h4 className="font-semibold text-foreground line-clamp-1 text-xs sm:text-sm md:text-xs lg:text-base">
                            {listing.title}
                          </h4>
                          <p className="text-[10px] sm:text-xs md:text-[10px] lg:text-sm text-muted-foreground truncate">
                            {listing.category}
                          </p>
                          <p className="text-sm sm:text-base md:text-sm lg:text-lg font-bold text-primary">
                            {formatPkr(listing.price * getExchangeRate())}
                          </p>
                          <p className="text-[9px] text-destructive">ID missing - contact support</p>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-6 md:mt-6 lg:mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="text-xs md:text-xs lg:text-sm h-8 md:h-8 lg:h-9"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 md:px-3 lg:px-4 text-xs md:text-xs lg:text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="text-xs md:text-xs lg:text-sm h-8 md:h-8 lg:h-9"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="p-6 sm:p-8 md:p-8 lg:p-12 text-center">
              <Search className="h-8 sm:h-10 md:h-10 lg:h-12 w-8 sm:w-10 md:w-10 lg:w-12 mx-auto text-muted-foreground mb-3 md:mb-3 lg:mb-4" />
              <h4 className="text-sm sm:text-base md:text-base lg:text-lg font-semibold mb-2">No listings found</h4>
              <p className="text-xs md:text-xs lg:text-sm text-muted-foreground mb-3 md:mb-3 lg:mb-4">
                Try adjusting your filters or search query
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategories([])
                  setSelectedTypes([])
                }}
                className="text-xs md:text-xs lg:text-sm"
              >
                Clear All Filters
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 sm:p-6 md:p-5 lg:p-8">
          <Skeleton className="h-6 md:h-7 lg:h-8 w-40 md:w-44 lg:w-48 mb-4 md:mb-5 lg:mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-2.5 lg:gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] md:aspect-[16/9]" />
                <CardContent className="p-3 md:p-2.5 lg:p-4 space-y-2">
                  <Skeleton className="h-4 md:h-3.5 lg:h-5 w-3/4" />
                  <Skeleton className="h-3 md:h-3 lg:h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  )
}
