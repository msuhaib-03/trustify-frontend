"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ShieldCheck, Upload, Check, X, AlertCircle, Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { BackButton } from "@/components/back-button"
import { cnicAPI } from "@/lib/api"
import { format, isValid } from "date-fns"

// Updated interface to match actual backend response
// Backend returns: PENDING | APPROVED | REJECTED
interface UserVerification {
  id?: string
  verificationId?: string
  // Extracted data from CNIC
  extractedName?: string
  extractedCnicNumber?: string
  // Image URLs - backend may use different naming
  frontImageUrl?: string
  backImageUrl?: string
  cnicFrontImage?: string  // Alternative field name
  cnicBackImage?: string   // Alternative field name
  // Status - Backend uses APPROVED not VERIFIED
  status: "PENDING" | "APPROVED" | "REJECTED"
  // Timestamps
  submittedAt?: string
  createdAt?: string  // Alternative field name
  reviewedAt?: string | null
  reviewedBy?: string | null
  // Admin feedback
  adminRemarks?: string | null
  rejectionReason?: string | null
  remarks?: string | null  // Alternative field name
}

// Safe date formatting helper
const safeFormatDate = (dateString: string | null | undefined, formatStr: string, fallback: string = "N/A"): string => {
  if (!dateString) return fallback
  try {
    const date = new Date(dateString)
    if (!isValid(date)) return fallback
    return format(date, formatStr)
  } catch {
    return fallback
  }
}

export default function IdentityVerificationPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verification, setVerification] = useState<UserVerification | null>(null)

  // Document uploads - store both File objects and preview URLs
  const [cnicFrontFile, setCnicFrontFile] = useState<File | null>(null)
  const [cnicBackFile, setCnicBackFile] = useState<File | null>(null)
  const [cnicFrontPreview, setCnicFrontPreview] = useState<string | null>(null)
  const [cnicBackPreview, setCnicBackPreview] = useState<string | null>(null)

  const cnicFrontInputRef = useRef<HTMLInputElement>(null)
  const cnicBackInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchVerification()
    
    // Poll for verification status every 30 seconds to catch admin approvals/rejections
    const interval = setInterval(() => {
      fetchVerification()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchVerification = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setIsLoading(false)
        return
      }
      
      const response = await cnicAPI.getMyStatus()
      const data = response.data
      
      if (data && (data.status || data.verificationId || data.id)) {
        setVerification(data)
        // Populate previews with existing images if available (handle different field names)
        const frontUrl = data.frontImageUrl || data.cnicFrontImage
        const backUrl = data.backImageUrl || data.cnicBackImage
        if (frontUrl) {
          setCnicFrontPreview(frontUrl)
        }
        if (backUrl) {
          setCnicBackPreview(backUrl)
        }
      } else {
        setVerification(null)
      }
    } catch (error: unknown) {
      // Check if it's a 404 (no verification found) vs actual error
      const axiosError = error as { response?: { status?: number } }
      if (axiosError?.response?.status !== 404) {
        console.error("Error fetching verification:", error)
      }
      setVerification(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setFile: (file: File | null) => void,
    setPreview: (value: string | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      setFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation - check for File objects
    if (!cnicFrontFile || !cnicBackFile) {
      toast.error("Please upload both CNIC front and back images")
      return
    }

    setIsSubmitting(true)
    try {
      const submitResponse = await cnicAPI.submit({
        frontImage: cnicFrontFile,
        backImage: cnicBackFile,
      })

      toast.success("Verification submitted successfully! We'll review it shortly.")
      
      // Clear the file inputs since they've been submitted
      setCnicFrontFile(null)
      setCnicBackFile(null)
      
      // If submit response contains verification data, use it directly
      const submittedData = submitResponse?.data
      if (submittedData && (submittedData.status || submittedData.verificationId || submittedData.id)) {
        // Ensure status is set to PENDING if not provided
        setVerification({
          ...submittedData,
          status: submittedData.status || "PENDING"
        })
      } else {
        // Wait a moment for backend to process, then fetch updated status
        setTimeout(async () => {
          await fetchVerification()
        }, 1000)
      }
      
    } catch (error) {
      console.error("Verification submission error:", error)
      toast.error("Failed to submit verification. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-600"
      case "APPROVED":
        return "bg-green-500/10 text-green-600"
      case "REJECTED":
        return "bg-red-500/10 text-red-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-3 w-3" />
      case "APPROVED":
        return <Check className="h-3 w-3" />
      case "REJECTED":
        return <X className="h-3 w-3" />
      default:
        return <AlertCircle className="h-3 w-3" />
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      <BackButton />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
          <ShieldCheck className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Identity Verification</h1>
          <p className="text-sm text-muted-foreground">Complete KYC to unlock all features</p>
        </div>
      </div>

      {/* Verification Status Panel */}
      {verification && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Verification Status</CardTitle>
              <Badge className={`${getStatusColor(verification.status)} flex items-center gap-1`}>
                {getStatusIcon(verification.status)}
                {verification.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* PENDING STATE - Professional Review Message */}
            {verification.status === "PENDING" && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-yellow-700 dark:text-yellow-500">Verification Under Review</p>
                    <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80">
                      Your verification request is currently under review. You will be notified once the verification process is completed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* APPROVED STATE */}
            {verification.status === "APPROVED" && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-green-700 dark:text-green-500">Account Verified</p>
                    <p className="text-sm text-green-600/80 dark:text-green-400/80">
                      Your account has been successfully verified. You can now create listings, purchase items, and rent products on Trustify.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* REJECTED STATE */}
            {verification.status === "REJECTED" && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <X className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-destructive">Verification Rejected</p>
                    {verification.rejectionReason && (
                      <p className="text-sm text-destructive/80">Reason: {verification.rejectionReason}</p>
                    )}
                    {verification.adminRemarks && (
                      <p className="text-xs text-muted-foreground mt-2">Admin remarks: {verification.adminRemarks}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      Your verification request was rejected. Please re-submit clear and valid CNIC images.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submitted Document Preview (for PENDING state) */}
            {verification.status === "PENDING" && ((verification.frontImageUrl || verification.cnicFrontImage) || (verification.backImageUrl || verification.cnicBackImage)) && (
              <div className="space-y-3 pt-3 border-t">
                <p className="text-sm font-medium">Submitted Documents</p>
                <div className="grid grid-cols-2 gap-3">
                  {(verification.frontImageUrl || verification.cnicFrontImage) && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">CNIC Front</p>
                      <img
                        src={verification.frontImageUrl || verification.cnicFrontImage}
                        alt="CNIC Front"
                        className="w-full aspect-video object-contain border rounded-lg bg-muted"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    </div>
                  )}
                  {(verification.backImageUrl || verification.cnicBackImage) && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">CNIC Back</p>
                      <img
                        src={verification.backImageUrl || verification.cnicBackImage}
                        alt="CNIC Back"
                        className="w-full aspect-video object-contain border rounded-lg bg-muted"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none"
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verification Form - Only show when no verification exists OR rejected */}
      {(!verification || verification.status === "REJECTED") && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CNIC Document Upload */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">CNIC Document Upload</CardTitle>
              <CardDescription>Upload clear photos of your CNIC front and back</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    CNIC Front <span className="text-destructive">*</span>
                  </Label>
                  <div
                    onClick={() => cnicFrontInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors aspect-video flex items-center justify-center"
                  >
                    {cnicFrontPreview ? (
                      <img
                        src={cnicFrontPreview || "/placeholder.svg"}
                        alt="CNIC Front"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={cnicFrontInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setCnicFrontFile, setCnicFrontPreview)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    CNIC Back <span className="text-destructive">*</span>
                  </Label>
                  <div
                    onClick={() => cnicBackInputRef.current?.click()}
                    className="border-2 border-dashed rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors aspect-video flex items-center justify-center"
                  >
                    {cnicBackPreview ? (
                      <img
                        src={cnicBackPreview || "/placeholder.svg"}
                        alt="CNIC Back"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={cnicBackInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, setCnicBackFile, setCnicBackPreview)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Submitting Verification...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Submit for Verification
              </>
            )}
          </Button>
        </form>
      )}

      {/* Verification History */}
      {verification && (verification.submittedAt || verification.createdAt) && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Verification History</CardTitle>
            <CardDescription>Track your verification attempts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Verification #{(verification.verificationId || verification.id || "").toString().split("-")[0] || "1"}
                </span>
                <Badge className={`${getStatusColor(verification.status)} text-xs`}>
                  {verification.status}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Submitted: {safeFormatDate(verification.submittedAt || verification.createdAt, "PPp")}</p>
                {verification.reviewedAt && safeFormatDate(verification.reviewedAt, "PPp") !== "N/A" && (
                  <p>Reviewed: {safeFormatDate(verification.reviewedAt, "PPp")}</p>
                )}
                {verification.reviewedBy && <p>Reviewed by: {verification.reviewedBy}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
