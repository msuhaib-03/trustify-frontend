"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Home,
  ListFilter,
  Heart,
  User,
  MessageSquare,
  Receipt,
  LogOut,
  Menu,
  X,
  Plus,
  Shield,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { LogoutDialog } from "@/components/logout-dialog"
import { toast } from "sonner"

const navLinks = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/listings", label: "Listings", icon: ListFilter },
  { href: "/my-listings", label: "My Listings", icon: ListFilter },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/profile", label: "Profile", icon: User },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/listings?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery("")
    }
  }

  const handleLogoutClick = () => {
    setIsMobileMenuOpen(false)
    setShowLogoutDialog(true)
  }

  const handleLogoutConfirm = () => {
    logout()
    toast.success("Logged out successfully")
    router.push("/")
  }

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href={isAuthenticated ? "/home" : "/"} className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Trustify
              </span>
            </Link>

            {/* Desktop Search Bar */}
            {isAuthenticated && (
              <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search listings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/50"
                  />
                </div>
              </form>
            )}

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {isAuthenticated ? (
                <>
                  {navLinks.slice(0, 4).map((link) => (
                    <Link key={link.href} href={link.href}>
                      <Button
                        variant={pathname === link.href ? "secondary" : "ghost"}
                        size="sm"
                        className={cn("gap-2", pathname === link.href && "bg-primary/10 text-primary")}
                      >
                        <link.icon className="h-4 w-4" />
                        <span className="hidden lg:inline">{link.label}</span>
                      </Button>
                    </Link>
                  ))}
                  <Link href="/create-listing">
                    <Button size="sm" className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      <Plus className="h-4 w-4" />
                      <span className="hidden lg:inline">Create</span>
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="ghost" size="sm">
                      Sign Up
                    </Button>
                  </Link>
                  <Link href="/admin-login">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                </>
              )}
              <ThemeToggle />
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogoutClick}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border md:hidden"
            >
              <div className="px-4 py-4 space-y-2 bg-background">
                {isAuthenticated && (
                  <form onSubmit={handleSearch} className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search listings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </form>
                )}

                {isAuthenticated ? (
                  <>
                    {navLinks.map((link) => (
                      <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                        <Button
                          variant={pathname === link.href ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3",
                            pathname === link.href && "bg-primary/10 text-primary",
                          )}
                        >
                          <link.icon className="h-5 w-5" />
                          {link.label}
                        </Button>
                      </Link>
                    ))}
                    <Link href="/create-listing" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full justify-start gap-3 bg-gradient-to-r from-primary to-accent">
                        <Plus className="h-5 w-5" />
                        Create Listing
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-start gap-3 bg-transparent">
                          <Shield className="h-4 w-4" />
                          Admin Dashboard
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                      onClick={handleLogoutClick}
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        Sign Up
                      </Button>
                    </Link>
                    <Link href="/admin-login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                        <Shield className="h-4 w-4" />
                        Login as Admin
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <LogoutDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog} onConfirm={handleLogoutConfirm} />
    </>
  )
}
