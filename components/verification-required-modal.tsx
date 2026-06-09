"use client"

import { useRouter } from "next/navigation"
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface VerificationRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  actionType?: "buy" | "rent" | "create-listing"
}

export function VerificationRequiredModal({
  isOpen,
  onClose,
  actionType = "buy",
}: VerificationRequiredModalProps) {
  const router = useRouter()

  const handleVerifyNow = () => {
    onClose()
    router.push("/verification")
  }

  const getActionText = () => {
    switch (actionType) {
      case "buy":
        return "purchasing items"
      case "rent":
        return "renting items"
      case "create-listing":
        return "creating listings"
      default:
        return "this action"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
            <ShieldAlert className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">Verification Required</DialogTitle>
          <DialogDescription className="text-center pt-2 text-muted-foreground">
            Please complete account verification before {getActionText()}. This helps ensure marketplace safety and secure transactions.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Why verification?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Verification helps protect both buyers and sellers by confirming identities and reducing fraud risk.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Quick & Easy</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The verification process only takes a few minutes. You will need your CNIC front and back images.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerifyNow}
            className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <ShieldCheck className="h-4 w-4" />
            Verify Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default VerificationRequiredModal
