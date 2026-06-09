"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Shield,
  Users,
  ListFilter,
  Receipt,
  AlertTriangle,
  Brain,
  BarChart3,
  Settings,
  LogOut,
  MessageSquare,
  Menu,
  X,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { LogoutDialog } from "@/components/logout-dialog"

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: ListFilter },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt },
  { href: "/admin/chats", label: "Chats", icon: MessageSquare },
  { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/admin/fraud-detection", label: "Fraud Detection", icon: Brain },
  { href: "/admin/feedback", label: "Users Feedback", icon: MessageSquareText },
  { href: "/admin/verifications", label: "User Verifications", icon: ShieldCheck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleLogoutClick = () => {
    setMobileMenuOpen(false)
    setShowLogoutDialog(true)
  }

  const handleLogoutConfirm = () => {
    logout()
    toast.success("Logged out successfully")
    router.push("/login")
  }

  const handleNavClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-background flex overflow-x-hidden">
        <aside className="hidden lg:flex w-64 border-r bg-card flex-col">
          <div className="p-4 border-b">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-lg font-bold">Trustify</span>
                <p className="text-xs text-muted-foreground">Admin Portal</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {adminNavItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={pathname === item.href ? "secondary" : "ghost"}
                  className={cn("w-full justify-start gap-3", pathname === item.href && "bg-primary/10 text-primary")}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t space-y-2">
            <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleLogoutClick}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <header className="lg:hidden sticky top-0 z-50 bg-background border-b">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                  <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-base font-bold">Trustify</span>
                  <p className="text-[10px] text-muted-foreground">Admin</p>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t bg-background overflow-hidden"
                >
                  <nav className="p-3 space-y-1">
                    {adminNavItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={handleNavClick}>
                        <Button
                          variant={pathname === item.href ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3",
                            pathname === item.href && "bg-primary/10 text-primary",
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                    <div className="pt-2 border-t mt-2">
                      <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleLogoutClick}>
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </nav>
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-x-hidden">{children}</main>
        </div>
      </div>

      <LogoutDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} onConfirm={handleLogoutConfirm} />
    </ProtectedRoute>
  )
}
