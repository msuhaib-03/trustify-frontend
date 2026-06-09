"use client"

import type React from "react"

import { useState } from "react"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CreditCard, Lock } from "lucide-react"
import { toast } from "sonner"

interface StripePaymentFormProps {
  clientSecret: string
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
}

export function StripePaymentForm({ clientSecret, amount, onSuccess, onError }: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setIsProcessing(false)
      return
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (error) {
        onError(error.message || "Payment failed")
        toast.error(error.message || "Payment failed")
      } else if (paymentIntent?.status === "succeeded") {
        toast.success("Payment successful!")
        onSuccess()
      } else if (paymentIntent?.status === "requires_capture") {
        toast.success("Payment authorized - funds held in escrow")
        onSuccess()
      }
    } catch (err) {
      onError("An unexpected error occurred")
      toast.error("An unexpected error occurred")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
        <CardDescription>Enter your card information to complete the payment</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-4 border rounded-lg">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#424770",
                    "::placeholder": {
                      color: "#aab7c4",
                    },
                  },
                  invalid: {
                    color: "#9e2146",
                  },
                },
              }}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="text-2xl font-bold">Rs. {amount.toLocaleString()}</span>
          </div>

          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Pay Rs. {amount.toLocaleString()}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your payment is secured with Stripe. Funds will be held in escrow until the transaction is completed.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
