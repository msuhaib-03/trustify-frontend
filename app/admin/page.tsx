"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import {
  Users,
  ListFilter,
  Receipt,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldAlert,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { adminAPI } from "@/lib/api"
import { getExchangeRate } from "@/lib/currency"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  type: "USER" | "TRANSACTION" | "FRAUD" | "DISPUTE" | "LISTING"
  action: string
  user: string
  createdAt: string
}

interface SystemHealth {
  memoryUsagePct: number
  dbLoadPct: number
  fraudRate: number
  aiAccuracy: number
  apiResponseMs: number
}

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeListings: 0,
    totalTransactions: 0,
    pendingDisputes: 0,
    monthlyRevenue: 0,
    fraudAlerts: 0,
  })
  const [revenueData, setRevenueData]     = useState<{ name: string; value: number }[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [health, setHealth]               = useState<SystemHealth>({
    memoryUsagePct: 0,
    dbLoadPct: 0,
    fraudRate: 0,
    aiAccuracy: 0,
    apiResponseMs: 0,
  })
  const [fraudDistribution, setFraudDistribution] = useState([
    { name: "Low Risk",    value: 65, color: "#22c55e" },
    { name: "Medium Risk", value: 25, color: "#f59e0b" },
    { name: "High Risk",   value: 10, color: "#ef4444" },
  ])

  const fetchStats = useCallback(async () => {
    const t0 = performance.now()
    try {
      const response = await adminAPI.stats()
      const apiResponseMs = Math.round(performance.now() - t0)
      const data = response.data || {}
      setStats({
        totalUsers:        data.totalUsers        || 0,
        activeListings:    data.activeListings    || 0,
        totalTransactions: data.totalTransactions || 0,
        pendingDisputes:   data.pendingDisputes   || 0,
        monthlyRevenue:    data.monthlyRevenue    || 0,
        fraudAlerts:       data.fraudAlerts       || 0,
      })

      // Update fraud pie chart from live counts
      const total = data.totalUsers || 1
      const high  = data.fraudAlerts || 0
      const med   = Math.round(high * 1.8)          // rough medium ≈ 1.8× high
      const low   = Math.max(0, total - high - med)
      setFraudDistribution([
        { name: "Low Risk",    value: Math.round((low  / total) * 100), color: "#22c55e" },
        { name: "Medium Risk", value: Math.round((med  / total) * 100), color: "#f59e0b" },
        { name: "High Risk",   value: Math.round((high / total) * 100), color: "#ef4444" },
      ])

      // Store measured API latency — health fetch will pick it up
      setHealth((prev) => ({ ...prev, apiResponseMs }))
    } catch (error) {
      console.error("[Admin Dashboard] Failed to fetch stats:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchWidgets = useCallback(async () => {
    const [revenueRes, activityRes, healthRes] = await Promise.allSettled([
      adminAPI.getMonthlyRevenue(),
      adminAPI.getRecentActivity(8),
      adminAPI.getSystemHealth(),
    ])

    if (revenueRes.status === "fulfilled") {
      const raw: { name: string; value: number }[] = revenueRes.value.data || []
      // Convert cents → PKR for display (÷100 USD × 282 PKR)
      setRevenueData(raw.map((p) => ({ name: p.name, value: Math.round((p.value / 100) * 282) })))
    }

    if (activityRes.status === "fulfilled") {
      setRecentActivity(activityRes.value.data || [])
    }

    if (healthRes.status === "fulfilled") {
      const h = healthRes.value.data || {}
      setHealth((prev) => ({
        ...prev,
        memoryUsagePct: h.memoryUsagePct ?? prev.memoryUsagePct,
        dbLoadPct:      h.dbLoadPct      ?? prev.dbLoadPct,
        fraudRate:      h.fraudRate      ?? prev.fraudRate,
        aiAccuracy:     h.aiAccuracy     ?? prev.aiAccuracy,
      }))
    }
  }, [])

  useEffect(() => {
    fetchStats()
    fetchWidgets()

    // Poll stats every 5 s; refresh widgets every 30 s
    const statsInterval   = setInterval(fetchStats,   5_000)
    const widgetsInterval = setInterval(fetchWidgets, 30_000)

    return () => {
      clearInterval(statsInterval)
      clearInterval(widgetsInterval)
    }
  }, [fetchStats, fetchWidgets])

  const calculateChange = (current: number, type: string) => {
    // In real implementation, this would compare with previous period data
    // For now, return positive changes for growth metrics, negative for disputes/fraud
    if (type === "pendingDisputes" || type === "fraudAlerts") {
      return current > 0 ? { change: "-5%", trend: "down" as const } : { change: "0%", trend: "down" as const }
    }
    return { change: "+12%", trend: "up" as const }
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      ...calculateChange(stats.totalUsers, "totalUsers"),
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Active Listings",
      value: stats.activeListings.toLocaleString(),
      ...calculateChange(stats.activeListings, "activeListings"),
      icon: ListFilter,
      color: "text-green-500",
    },
    {
      title: "Transactions",
      value: stats.totalTransactions.toLocaleString(),
      ...calculateChange(stats.totalTransactions, "totalTransactions"),
      icon: Receipt,
      color: "text-purple-500",
    },
    {
      title: "Pending Disputes",
      value: stats.pendingDisputes.toString(),
      ...calculateChange(stats.pendingDisputes, "pendingDisputes"),
      icon: AlertTriangle,
      color: "text-yellow-500",
    },
    {
      title: "Monthly Revenue",
      value:
        stats.monthlyRevenue > 0
          ? `Rs. ${Math.round((stats.monthlyRevenue / 100) * getExchangeRate()).toLocaleString()}`
          : "Rs. 0",
      ...calculateChange(stats.monthlyRevenue, "monthlyRevenue"),
      icon: DollarSign,
      color: "text-emerald-500",
    },
    {
      title: "Fraud Alerts",
      value: stats.fraudAlerts.toString(),
      ...calculateChange(stats.fraudAlerts, "fraudAlerts"),
      icon: ShieldAlert,
      color: "text-red-500",
    },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome to Trustify Admin Portal</p>
        </div>
        <Badge variant="outline" className="gap-1 w-fit">
          <Activity className="h-3 w-3" />
          Live
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {isLoading
          ? [...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3 sm:p-4">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-12" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                      <span
                        className={`text-[10px] sm:text-xs flex items-center gap-1 ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}
                      >
                        {stat.trend === "up" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.title}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Revenue Overview</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Monthly transaction volume</CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <div className="h-[200px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-[10px] sm:text-xs" tick={{ fontSize: 10 }} width={30} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-primary)"
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fraud Risk Distribution */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Risk Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Transaction risk levels</CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-6 pt-0">
            <div className="h-[150px] sm:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fraudDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {fraudDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {fraudDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs sm:text-sm">{item.name}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Activity — live from backend */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Latest platform activities</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                        activity.type === "FRAUD"
                          ? "bg-red-500/10 text-red-500"
                          : activity.type === "DISPUTE"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : activity.type === "TRANSACTION"
                              ? "bg-green-500/10 text-green-500"
                              : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {activity.type === "FRAUD" ? (
                        <ShieldAlert className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : activity.type === "DISPUTE" ? (
                        <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : activity.type === "TRANSACTION" ? (
                        <Receipt className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : activity.type === "LISTING" ? (
                        <ListFilter className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{activity.action}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{activity.user}</p>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                      {activity.createdAt
                        ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Health — live from backend + frontend timing */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">System Health</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Platform performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
            {/* API Response Time — measured by frontend */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>API Response Time</span>
                <span className={health.apiResponseMs < 200 ? "text-green-500" : health.apiResponseMs < 500 ? "text-yellow-500" : "text-red-500"}>
                  {health.apiResponseMs > 0 ? `${health.apiResponseMs}ms` : "—"}
                </span>
              </div>
              {/* Bar: 0ms=0%, 1000ms=100% */}
              <Progress value={Math.min(health.apiResponseMs / 10, 100)} className="h-1.5 sm:h-2" />
            </div>
            {/* DB Load — proxy from collection sizes */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Database Load</span>
                <span className={health.dbLoadPct < 50 ? "text-green-500" : health.dbLoadPct < 80 ? "text-yellow-500" : "text-red-500"}>
                  {health.dbLoadPct > 0 ? `${health.dbLoadPct}%` : "—"}
                </span>
              </div>
              <Progress value={health.dbLoadPct} className="h-1.5 sm:h-2" />
            </div>
            {/* Memory Usage — real JVM heap */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Memory Usage</span>
                <span className={health.memoryUsagePct < 60 ? "text-green-500" : health.memoryUsagePct < 85 ? "text-yellow-500" : "text-red-500"}>
                  {health.memoryUsagePct > 0 ? `${health.memoryUsagePct}%` : "—"}
                </span>
              </div>
              <Progress value={health.memoryUsagePct} className="h-1.5 sm:h-2" />
            </div>
            {/* AI Model Accuracy — static mock */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>AI Model Accuracy</span>
                <span className="text-green-500">{health.aiAccuracy > 0 ? `${health.aiAccuracy}%` : "—"}</span>
              </div>
              <Progress value={health.aiAccuracy} className="h-1.5 sm:h-2" />
            </div>
            {/* Fraud Detection Rate — calculated from clean tx ratio */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Fraud Detection Rate</span>
                <span className={health.fraudRate >= 90 ? "text-green-500" : "text-yellow-500"}>
                  {health.fraudRate > 0 ? `${health.fraudRate}%` : "—"}
                </span>
              </div>
              <Progress value={health.fraudRate} className="h-1.5 sm:h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
