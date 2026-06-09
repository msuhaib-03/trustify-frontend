"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LogoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  redirectPath?: string
}

export function LogoutDialog({ open, onOpenChange, onConfirm }: LogoutDialogProps) {
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)
  const [showLoggingOutPopup, setShowLoggingOutPopup] = useState(false)

  // Sync showConfirmPopup with the open prop
  useEffect(() => {
    if (open) {
      setShowConfirmPopup(true)
      setShowLoggingOutPopup(false)
    } else {
      setShowConfirmPopup(false)
      setShowLoggingOutPopup(false)
    }
  }, [open])

  const handleCancel = () => {
    // Close Popup #1, no logout action
    setShowConfirmPopup(false)
    onOpenChange(false)
  }

  const handleSure = () => {
    setShowConfirmPopup(false)

    // Small delay to ensure clean transition between popups
    setTimeout(() => {
      setShowLoggingOutPopup(true)

      // After 1.5 seconds, perform logout and close Popup #2
      setTimeout(() => {
        onConfirm()
        setShowLoggingOutPopup(false)
        onOpenChange(false)
      }, 1500)
    }, 150)
  }

  return (
    <>
      {/* POPUP #1: Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmPopup && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/80"
              onClick={handleCancel}
            />
            {/* Popup #1 Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <LogOut className="h-5 w-5 text-destructive" />
                    Confirm Logout
                  </h2>
                  <p className="text-sm text-muted-foreground">Are you sure you want to log out?</p>
                </div>
                <div className="flex flex-row justify-end gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleSure}>
                    Sure
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* POPUP #2: Logging Out Dialog (Separate, No Buttons) */}
      <AnimatePresence>
        {showLoggingOutPopup && (
          <>
            {/* Backdrop - No click handler to prevent closing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/80"
            />
            {/* Popup #2 Content - Informational Only, No Buttons */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-8 shadow-lg"
            >
              <div className="flex flex-col items-center justify-center gap-4">
                {/* Animated Spinner */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Loader2 className="h-12 w-12 text-primary" />
                </motion.div>
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">We are logging you out</p>
                  <p className="mt-1 text-sm text-muted-foreground">Please wait...</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
