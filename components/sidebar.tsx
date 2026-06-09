"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  Home,
  ListFilter,
  Heart,
  User,
  MessageSquare,
  Receipt,
  Plus,
  Shield,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

const sidebarLinks = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/listings", label: "Browse Listings", icon: ListFilter },
  { href: "/my-listings", label: "My Listings", icon: ListFilter },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/chat", label: "Messages", icon: MessageSquare },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/feedback", label: "User Feedback", icon: MessageSquareText },
  { href: "/verification", label: "Identity Verification", icon: ShieldCheck },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isAdmin } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 256 }}
      className="hidden lg:flex flex-col h-[calc(100vh-64px)] sticky top-16 border-r border-border bg-sidebar"
    >
      <div className="flex flex-col flex-1 py-4 overflow-y-auto">
        <div className="px-3 space-y-1">
          {sidebarLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={pathname === link.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 transition-all",
                  pathname === link.href && "bg-primary/10 text-primary border-l-2 border-primary rounded-l-none",
                  isCollapsed && "justify-center px-2",
                )}
              >
                <link.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{link.label}</span>}
              </Button>
            </Link>
          ))}
        </div>

        <div className="px-3 mt-4">
          <Link href="/create-listing">
            <Button
              className={cn(
                "w-full gap-3 bg-gradient-to-r from-primary to-accent hover:opacity-90",
                isCollapsed ? "justify-center px-2" : "justify-start",
              )}
            >
              <Plus className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>Create Listing</span>}
            </Button>
          </Link>
        </div>

        {isAdmin && (
          <div className="px-3 mt-4">
            <Link href="/admin">
              <Button
                variant="outline"
                className={cn("w-full gap-3", isCollapsed ? "justify-center px-2" : "justify-start")}
              >
                <Shield className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>Admin Dashboard</span>}
              </Button>
            </Link>
          </div>
        )}

        <div className={cn("px-3 mt-4", isCollapsed ? "flex justify-center" : "")}>
          <div className={cn("flex items-center gap-2", !isCollapsed && "pl-2")}>
            <ThemeToggle />
            {!isCollapsed && <span className="text-sm text-muted-foreground">Toggle Theme</span>}
          </div>
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn("w-full", isCollapsed ? "justify-center" : "justify-end")}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </motion.aside>
  )
}
