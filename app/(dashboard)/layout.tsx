"use client"

import type React from "react"

import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"
import { ProtectedRoute } from "@/components/protected-route"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-h-[calc(100vh-64px)] min-w-0 overflow-x-hidden">{children}</main>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  )
}
