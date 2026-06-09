"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Mail, Phone, MapPin, Camera, Save, Shield, Edit2, Lock, Eye, EyeOff, Star, CheckCircle2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BackButton } from "@/components/back-button"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { trustAPI, userAPI, transactionAPI, listingAPI } from "@/lib/api"
import { getRiskLevelColor, getTrustBadgeColor } from "@/services/mockTrustFraudService"

interface TrustProfile {
  fraudScore: number
  trustRating: number
  riskLevel: "SAFE" | "MEDIUM" | "HIGH" | "CRITICAL"
  trustBadge: "TRUSTED" | "NORMAL" | "RISKY"
  verified: boolean
  disputeCount: number
  totalTransactions: number
  successfulTransactions: number
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [trustProfile, setTrustProfile] = useState<TrustProfile | null>(null)
  const [isLoadingTrust, setIsLoadingTrust] = useState(true)
  const [accountStats, setAccountStats] = useState({
    activeListings: 0,
    completedSales: 0,
    totalRentals: 0,
  })

  // Fetch trust profile on mount
  useEffect(() => {
    const fetchTrustProfile = async () => {
      try {
        const response = await trustAPI.getCurrentUserTrustProfile()
        setTrustProfile(response.data)
      } catch (error) {
        console.error("Failed to fetch trust profile:", error)
      } finally {
        setIsLoadingTrust(false)
      }
    }
    fetchTrustProfile()
  }, [])

  // Fetch account stats — runs once user is available
  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      try {
        const [txRes, listingRes] = await Promise.allSettled([
          transactionAPI.getAll({ userId: user.id || user.email }),
          listingAPI.getMine(),
        ])

        if (txRes.status === "fulfilled") {
          const txs: any[] = txRes.value.data?.content || txRes.value.data || []
          const completedSaleStatuses = new Set(["COMPLETED", "RELEASED", "DELIVERED_AUTO"])
          const rentalStatuses = new Set([
            "RENTAL_IN_PROGRESS", "RENT_ACTIVE", "RENTAL_RETURNED",
            "RENT_COMPLETED", "DAMAGE_RESOLVED",
          ])
          setAccountStats((prev) => ({
            ...prev,
            completedSales: txs.filter(
              (t) => t.type === "SALE" && completedSaleStatuses.has(t.status)
            ).length,
            totalRentals: txs.filter(
              (t) => t.type === "RENT" && (rentalStatuses.has(t.status) ||
                ["COMPLETED", "RELEASED"].includes(t.status))
            ).length,
          }))
        }

        if (listingRes.status === "fulfilled") {
          const listings: any[] = listingRes.value.data?.content || listingRes.value.data || []
          setAccountStats((prev) => ({
            ...prev,
            activeListings: listings.filter((l) => l.status === "ACTIVE").length,
          }))
        }
      } catch {
        // silently ignore — stats stay at 0
      }
    }
    fetchStats()
  }, [user?.id, user?.email])
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: "",
    location: "",
  })

  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordErrors, setPasswordErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const handleSave = () => {
    // Update user data
    updateUser({ ...user!, username: formData.username })
    setIsEditing(false)
    setShowPasswordSection(false)
    setPasswordData({ newPassword: "", confirmPassword: "" })
    setPasswordErrors({ newPassword: "", confirmPassword: "" })
    toast.success("Profile updated successfully")
  }

  const validatePasswordFields = () => {
    const errors = { newPassword: "", confirmPassword: "" }
    let isValid = true

    if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters"
      isValid = false
    }

    if (passwordData.confirmPassword !== passwordData.newPassword) {
      errors.confirmPassword = "Passwords do not match"
      isValid = false
    }

    setPasswordErrors(errors)
    return isValid
  }

  const handleUpdatePassword = async () => {
    if (!validatePasswordFields()) {
      return
    }

    setIsUpdatingPassword(true)

    try {
      await userAPI.updatePassword(passwordData.newPassword)
      toast.success("Password updated successfully")

      // Reset and close password section
      setPasswordData({ newPassword: "", confirmPassword: "" })
      setPasswordErrors({ newPassword: "", confirmPassword: "" })
      setShowPasswordSection(false)
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Failed to update password"
      toast.error(msg)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleCancelPasswordUpdate = () => {
    setPasswordData({ newPassword: "", confirmPassword: "" })
    setPasswordErrors({ newPassword: "", confirmPassword: "" })
    setShowPasswordSection(false)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton fallbackUrl="/home" />
            <h1 className="text-2xl font-bold">My Profile</h1>
          </div>
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="gap-2"
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.profileImage || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity">
                      <Camera className="h-4 w-4" />
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                  )}
                </div>

                {/* User Info */}
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-2xl font-bold text-foreground">{user?.username}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3 text-green-500" />
                      Verified User
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your personal information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" value={formData.email} disabled className="pl-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+92 300 1234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="location"
                      placeholder="City, Pakistan"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-accent">
                    Save Changes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Trust & Safety Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Trust & Safety
              </CardTitle>
              <CardDescription>Your fraud score, trust rating, and verification status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingTrust ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : trustProfile ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Fraud Score */}
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Fraud Score</span>
                        <Badge variant="outline" className={getRiskLevelColor(trustProfile.riskLevel)}>
                          {trustProfile.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold">{trustProfile.fraudScore}</span>
                        <span className="text-xs text-muted-foreground">/ 100</span>
                      </div>
                      <Progress value={trustProfile.fraudScore} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {trustProfile.riskLevel === "SAFE"
                          ? "Your account is in good standing"
                          : trustProfile.riskLevel === "MEDIUM"
                            ? "Some activity flagged for review"
                            : "High risk detected - verify your account"}
                      </p>
                    </div>

                    {/* Trust Rating */}
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Trust Rating</span>
                        <Badge variant="outline" className={getTrustBadgeColor(trustProfile.trustBadge)}>
                          {trustProfile.trustBadge === "TRUSTED"
                            ? "Trusted Seller"
                            : trustProfile.trustBadge === "NORMAL"
                              ? "Normal User"
                              : "Risky User"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.floor(trustProfile.trustRating)
                                  ? "fill-yellow-500 text-yellow-500"
                                  : i < trustProfile.trustRating
                                    ? "fill-yellow-500/50 text-yellow-500"
                                    : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-lg font-bold">{trustProfile.trustRating.toFixed(1)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Based on your transaction history and feedback
                      </p>
                    </div>

                    {/* Verification Status */}
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <span className="text-sm text-muted-foreground">Verification Status</span>
                      <div className="flex items-center gap-2">
                        {trustProfile.verified ? (
                          <>
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                            <span className="text-lg font-medium text-green-600">Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-6 w-6 text-yellow-500" />
                            <span className="text-lg font-medium text-yellow-600">Unverified</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {trustProfile.verified
                          ? "Your identity has been verified"
                          : "Complete verification to build trust"}
                      </p>
                    </div>

                    {/* Transaction Success */}
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <span className="text-sm text-muted-foreground">Transaction Success Rate</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {trustProfile.totalTransactions > 0
                            ? Math.round((trustProfile.successfulTransactions / trustProfile.totalTransactions) * 100)
                            : 100}
                          %
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {trustProfile.successfulTransactions} of {trustProfile.totalTransactions} transactions successful
                        {trustProfile.disputeCount > 0 && ` • ${trustProfile.disputeCount} disputes`}
                      </p>
                    </div>
                  </div>

                  {/* Reputation Badge */}
                  <div className="p-4 rounded-lg border bg-gradient-to-r from-primary/5 to-accent/5">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {trustProfile.trustBadge === "TRUSTED"
                            ? "Trusted Trader"
                            : trustProfile.trustBadge === "NORMAL"
                              ? "Verified Trader"
                              : "New Trader"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {trustProfile.trustBadge === "TRUSTED"
                            ? "You have an excellent reputation on Trustify"
                            : trustProfile.trustBadge === "NORMAL"
                              ? "Keep trading to build your reputation"
                              : "Complete more transactions to improve your badge"}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Unable to load trust profile</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showPasswordSection ? (
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordSection(true)}
                  className="gap-2"
                  disabled={!isEditing}
                >
                  <Lock className="h-4 w-4" />
                  Update Password
                </Button>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-2"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => {
                            setPasswordData({ ...passwordData, newPassword: e.target.value })
                            setPasswordErrors({ ...passwordErrors, newPassword: "" })
                          }}
                          className="pl-10 pr-10"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => {
                            setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                            setPasswordErrors({ ...passwordErrors, confirmPassword: "" })
                          }}
                          className="pl-10 pr-10"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={handleCancelPasswordUpdate} disabled={isUpdatingPassword}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword}>
                        {isUpdatingPassword ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{accountStats.activeListings}</p>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{accountStats.completedSales}</p>
                  <p className="text-sm text-muted-foreground">Completed Sales</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{accountStats.totalRentals}</p>
                  <p className="text-sm text-muted-foreground">Total Rentals</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">
                    {trustProfile ? trustProfile.trustRating.toFixed(1) : "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
