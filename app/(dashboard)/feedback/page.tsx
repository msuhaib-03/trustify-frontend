"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { MessageSquareText, Star, Send, CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { BackButton } from "@/components/back-button"
import { feedbackAPI } from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

interface Feedback {
  feedbackId: string
  userId: string
  userName: string
  userEmail: string
  feedbackType: "BUG_REPORT" | "FEATURE_REQUEST" | "PAYMENT_ISSUE" | "CHAT_ISSUE" | "OTHER"
  title: string
  message: string
  rating?: number | null
  status: "NEW" | "REVIEWED" | "RESOLVED"
  createdAt: string
  updatedAt: string
}

const feedbackTypes = [
  { value: "BUG_REPORT", label: "Bug Report" },
  { value: "FEATURE_REQUEST", label: "Feature Request" },
  { value: "PAYMENT_ISSUE", label: "Payment Issue" },
  { value: "CHAT_ISSUE", label: "Chat Issue" },
  { value: "OTHER", label: "Other" },
]

export default function UserFeedbackPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userFeedback, setUserFeedback] = useState<Feedback[]>([])

  // Form state
  const [feedbackType, setFeedbackType] = useState<Feedback["feedbackType"] | "">("")
  const [rating, setRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchUserFeedback()
  }, [])

  const fetchUserFeedback = async () => {
    setIsLoading(true)
    try {
      const response = await feedbackAPI.getUserFeedback()
      setUserFeedback(response.data.content || [])
    } catch (error) {
      console.error("Failed to fetch feedback:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!feedbackType || !title.trim() || !message.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      await feedbackAPI.submit({
        feedbackType: feedbackType as Feedback["feedbackType"],
        rating,
        title: title.trim(),
        message: message.trim(),
      })

      toast.success("Feedback submitted successfully!")

      // Reset form
      setFeedbackType("")
      setRating(null)
      setTitle("")
      setMessage("")

      // Refresh feedback list
      fetchUserFeedback()
    } catch (error) {
      toast.error("Failed to submit feedback. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-500/10 text-blue-600"
      case "REVIEWED":
        return "bg-yellow-500/10 text-yellow-600"
      case "RESOLVED":
        return "bg-green-500/10 text-green-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "NEW":
        return <AlertCircle className="h-3 w-3" />
      case "REVIEWED":
        return <Clock className="h-3 w-3" />
      case "RESOLVED":
        return <CheckCircle2 className="h-3 w-3" />
      default:
        return null
    }
  }

  const getTypeLabel = (type: string) => {
    return feedbackTypes.find((t) => t.value === type)?.label || type
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      <BackButton />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
          <MessageSquareText className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">User Feedback</h1>
          <p className="text-sm text-muted-foreground">Share your thoughts and help us improve</p>
        </div>
      </div>

      {/* Feedback Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Submit Feedback</CardTitle>
          <CardDescription>We value your input and will review it promptly</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Feedback Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Feedback Type <span className="text-destructive">*</span>
              </label>
              <Select value={feedbackType} onValueChange={(val) => setFeedbackType(val as Feedback["feedbackType"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  {feedbackTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating (Optional)</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star === rating ? null : star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        (hoverRating !== null ? star <= hoverRating : star <= (rating || 0))
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
                {rating && (
                  <span className="ml-2 text-sm text-muted-foreground self-center">
                    {rating} star{rating !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Feedback Title <span className="text-destructive">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your feedback"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Detailed Message <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your feedback in detail..."
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Previous Feedback */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Your Previous Feedback</CardTitle>
              <CardDescription>Track the status of your submissions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchUserFeedback} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : userFeedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquareText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">You haven't submitted any feedback yet</p>
              <p className="text-xs mt-1">Submit your first feedback above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userFeedback.map((feedback, index) => (
                <motion.div
                  key={feedback.feedbackId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{feedback.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(feedback.feedbackType)}
                        </Badge>
                        {feedback.rating && (
                          <div className="flex items-center gap-0.5">
                            {[...Array(feedback.rating)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(feedback.status)} text-xs flex items-center gap-1`}>
                      {getStatusIcon(feedback.status)}
                      {feedback.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{feedback.message}</p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
