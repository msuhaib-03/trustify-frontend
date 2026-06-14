"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Upload, X, Loader2, ImagePlus, ShieldAlert, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BackButton } from "@/components/back-button"
import { VerificationRequiredModal } from "@/components/verification-required-modal"
import { listingAPI, cnicAPI } from "@/lib/api"
import { formatPkr, getExchangeRate } from "@/lib/currency"
import { toast } from "sonner"

const categories = ["Electronics", "Fashion", "Furniture", "Sports", "Books", "Other"]

export default function CreateListingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingVerification, setIsCheckingVerification] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showElectronicsDisclaimer, setShowElectronicsDisclaimer] = useState(false)
  const [pendingCategory, setPendingCategory] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",          // USD amount (Stripe only supports USD)
    declaredValuePkr: "", // RENT only — item's market value in PKR (deposit auto-calculated from this)
    category: "",
    type: "SALE" as "SALE" | "RENT",
    rentalPeriod: "PER_DAY" as "PER_HOUR" | "PER_DAY",
  })

  // Category deposit percentages (must match backend defaults)
  const DEPOSIT_PCT: Record<string, number> = {
    Electronics: 90, Furniture: 70, Books: 80,
    Sports: 60, Fashion: 50, Other: 50,
  }
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  // Bidirectional currency converter — pkrPrice is the PKR input,
  // formData.price always stores the USD value that gets submitted.
  const [pkrPrice, setPkrPrice] = useState("")

  const RATE = getExchangeRate() // 282 PKR per 1 USD

  const handleUsdChange = (val: string) => {
    setFormData((f) => ({ ...f, price: val }))
    const usd = Number(val)
    setPkrPrice(usd > 0 ? Math.round(usd * RATE).toString() : "")
  }

  const handlePkrChange = (val: string) => {
    setPkrPrice(val)
    const pkr = Number(val)
    if (pkr > 0) {
      const usd = (pkr / RATE).toFixed(2)
      setFormData((f) => ({ ...f, price: usd }))
    } else {
      setFormData((f) => ({ ...f, price: "" }))
    }
  }

  useEffect(() => {
    checkVerificationStatus()
  }, [])

  const checkVerificationStatus = async () => {
    setIsCheckingVerification(true)
    try {
      const response = await cnicAPI.isVerified()
      setIsVerified(response.data.verified)
      
      // If not verified, show the modal immediately
      if (!response.data.verified) {
        setShowVerificationModal(true)
      }
    } catch (error) {
      console.error("Failed to check verification status:", error)
      setIsVerified(false)
      setShowVerificationModal(true)
    } finally {
      setIsCheckingVerification(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 5) {
      toast.error("Maximum 5 images allowed")
      return
    }

    setImages([...images, ...files])
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file))
    setPreviewUrls([...previewUrls, ...newPreviewUrls])
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index)
    URL.revokeObjectURL(previewUrls[index])
    setImages(newImages)
    setPreviewUrls(newPreviewUrls)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Double-check verification before submission
    if (!isVerified) {
      setShowVerificationModal(true)
      return
    }

    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      const submitData = new FormData()
      submitData.append("title", formData.title)
      submitData.append("description", formData.description)
      submitData.append("price", formData.price)
      submitData.append("category", formData.category)
      submitData.append("type", formData.type)
      if (formData.type === "RENT") {
        submitData.append("rentalPeriod", formData.rentalPeriod)
        if (formData.declaredValuePkr) {
          submitData.append("declaredValuePkr", formData.declaredValuePkr)
        }
      }

      images.forEach((image) => {
        submitData.append("images", image)
      })

      await listingAPI.create(submitData)
      toast.success("Listing created successfully!")
      router.push("/my-listings")
    } catch (error) {
      console.error("Failed to create listing:", error)
      toast.error("Failed to create listing")
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingVerification) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton fallbackUrl="/home" />
          <h1 className="text-2xl font-bold">Create New Listing</h1>
        </div>

        {/* Verification Warning Banner (shown if not verified but modal closed) */}
        {!isVerified && !showVerificationModal && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10"
          >
            <ShieldAlert className="h-5 w-5 text-yellow-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-600">Verification Required</p>
              <p className="text-xs text-muted-foreground">
                You need to complete verification before creating listings.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVerificationModal(true)}
              className="shrink-0 border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
            >
              Verify Now
            </Button>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Listing Details</CardTitle>
              <CardDescription>Fill in the details for your item. Be as descriptive as possible.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Images */}
                <div className="space-y-2">
                  <Label>Images (Max 5)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <img src={url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
                        <ImagePlus className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Add Image</span>
                        <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter listing title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your item in detail..."
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label>Listing Type *</Label>
                  <RadioGroup
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as "SALE" | "RENT" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="SALE" id="sale" />
                      <Label htmlFor="sale" className="cursor-pointer">
                        For Sale
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="RENT" id="rent" />
                      <Label htmlFor="rent" className="cursor-pointer">
                        For Rent
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => {
                      if (value === "Electronics") {
                        setPendingCategory(value)
                        setShowElectronicsDisclaimer(true)
                      } else {
                        setFormData({ ...formData, category: value })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type → rental period (only when RENT) */}
                {formData.type === "RENT" && (
                  <div className="space-y-2">
                    <Label>Rental Period *</Label>
                    <RadioGroup
                      value={formData.rentalPeriod}
                      onValueChange={(v) => setFormData({ ...formData, rentalPeriod: v as "PER_HOUR" | "PER_DAY" })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PER_DAY" id="per-day" />
                        <Label htmlFor="per-day" className="cursor-pointer">Per Day</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PER_HOUR" id="per-hour" />
                        <Label htmlFor="per-hour" className="cursor-pointer">Per Hour</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* ── Two-way PKR ↔ USD price converter ───────────────────── */}
                <div className="space-y-2">
                  <Label>
                    {formData.type === "RENT"
                      ? `Rental Price (per ${formData.rentalPeriod === "PER_HOUR" ? "hour" : "day"}) *`
                      : "Selling Price *"}
                  </Label>

                  {/* Converter row — USD side and arrow hidden from user; PKR only visible */}
                  <div className="flex items-end gap-2">
                    {/* PKR side — only box the user sees */}
                    <div className="flex-1 space-y-1">
                      <Input
                        type="number"
                        placeholder="e.g. 28,200"
                        min="0"
                        value={pkrPrice}
                        onChange={(e) => handlePkrChange(e.target.value)}
                      />
                    </div>

                    {/* Bidirectional arrow — hidden */}
                    <div className="pb-2 hidden">
                      <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* USD side — hidden from user, implementation kept intact */}
                    <div className="flex-1 space-y-1 hidden">
                      <p className="text-xs font-medium text-muted-foreground">Stripe charges (USD $)</p>
                      <Input
                        id="price"
                        type="number"
                        placeholder="e.g. 100"
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleUsdChange(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Converter explainer — hidden */}
                  <p className="text-xs text-muted-foreground hidden">
                    Type in <strong>either box</strong> — they update each other automatically.
                    The platform shows buyers the PKR amount; Stripe charges USD
                    (1 USD = {RATE} PKR).
                  </p>

                  {/* "This is what gets listed" summary — hidden */}
                  {formData.price && Number(formData.price) > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs hidden">
                      <span className="font-medium">{formatPkr(Number(formData.price) * RATE)}</span>
                      <span className="text-muted-foreground">=</span>
                      <span className="font-medium">${Number(formData.price).toFixed(2)} USD</span>
                      <span className="text-muted-foreground ml-auto">this is what gets listed</span>
                    </div>
                  )}
                  {formData.price && Number(formData.price) > 0 && Number(formData.price) < 0.5 && (
                    <p className="text-xs text-yellow-600 font-medium">
                      ⚠ Minimum price is $0.50 USD (~PKR 141). Stripe will reject lower amounts.
                    </p>
                  )}
                </div>

                {/* Declared market value (RENT only) → deposit auto-calculated */}
                {formData.type === "RENT" && (
                  <div className="space-y-2">
                    <Label htmlFor="declaredValue">
                      Item's Current Market Value (PKR) *
                    </Label>
                    <Input
                      id="declaredValue"
                      type="number"
                      placeholder="e.g. 5000 — what would it cost to replace this item?"
                      min="0"
                      value={formData.declaredValuePkr}
                      onChange={(e) => setFormData({ ...formData, declaredValuePkr: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      This is the item's replacement cost — used to calculate the security deposit.
                      It is <strong>not</strong> the rental price.
                    </p>
                    {/* Live deposit preview */}
                    {formData.declaredValuePkr && Number(formData.declaredValuePkr) > 0 && (
                      <div className="p-3 rounded-md bg-muted/60 text-xs space-y-1">
                        {formData.category ? (
                          <>
                            <p className="font-medium">
                              Security deposit preview
                              <span className="ml-1 text-muted-foreground font-normal">
                                ({DEPOSIT_PCT[formData.category] ?? 50}% of declared value — {formData.category})
                              </span>
                            </p>
                            <p className="text-primary font-semibold">
                              {formatPkr(Number(formData.declaredValuePkr) * (DEPOSIT_PCT[formData.category] ?? 50) / 100)}
                              {" "}deposit will be charged to the renter
                            </p>
                            <p className="text-muted-foreground">
                              Fully refunded when the item is returned undamaged.
                            </p>
                          </>
                        ) : (
                          <p className="text-muted-foreground">Select a category above to see the deposit preview.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Create Listing
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Verification Required Modal */}
        <VerificationRequiredModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          actionType="create-listing"
        />

        {/* Electronics Disclaimer Modal */}
        <Dialog open={showElectronicsDisclaimer} onOpenChange={setShowElectronicsDisclaimer}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Electronics Category Disclaimer</DialogTitle>
              <DialogDescription className="pt-4 text-sm leading-relaxed">
                If the electronic item contains software, then in case of any viruses, malware, operating system issues, or software damage, Trustify will not be responsible. However, if there is any physical damage to the product, you may open a dispute through the Trustify dispute system.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowElectronicsDisclaimer(false)
                  setPendingCategory(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (pendingCategory) {
                    setFormData({ ...formData, category: pendingCategory })
                  }
                  setShowElectronicsDisclaimer(false)
                  setPendingCategory(null)
                }}
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
