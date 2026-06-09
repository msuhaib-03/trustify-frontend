"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Flag, Search, Eye, RefreshCw, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import api from "@/lib/api"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Report {
  id: string
  type: string
  reason: string
  description: string
  status: string
  reporter: { id: string; username: string }
  reported: { id: string; username: string } | null
  listing: { id: string; title: string } | null
  createdAt: string
}

export default function AdminReportsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [resolution, setResolution] = useState("")

  useEffect(() => {
    fetchReports()
  }, [statusFilter, typeFilter])

  const fetchReports = async () => {
    setIsLoading(true)
    try {
      const response = await api.get("/admin/reports")
      setReports(response.data.content || [])
    } catch (error) {
      // Mock data
      setReports([
        {
          id: "RPT-001",
          type: "USER",
          reason: "Harassment",
          description: "User sent threatening messages",
          status: "PENDING",
          reporter: { id: "1", username: "reporter1" },
          reported: { id: "2", username: "baduser" },
          listing: null,
          createdAt: new Date().toISOString(),
        },
        {
          id: "RPT-002",
          type: "LISTING",
          reason: "Counterfeit Item",
          description: "This item appears to be fake",
          status: "PENDING",
          reporter: { id: "3", username: "reporter2" },
          reported: null,
          listing: { id: "1", title: "Designer Bag" },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolveReport = async (action: "dismiss" | "action_taken") => {
    if (!selectedReport) return
    try {
      await api.put(`/admin/reports/${selectedReport.id}/resolve`, {
        action,
        resolution,
      })
      toast.success(`Report ${action === "dismiss" ? "dismissed" : "resolved"}`)
      setSelectedReport(null)
      setResolution("")
      fetchReports()
    } catch (error) {
      toast.error("Failed to resolve report")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-600"
      case "RESOLVED":
        return "bg-green-500/10 text-green-600"
      case "DISMISSED":
        return "bg-gray-500/10 text-gray-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "USER":
        return "bg-blue-500/10 text-blue-600"
      case "LISTING":
        return "bg-purple-500/10 text-purple-600"
      case "TRANSACTION":
        return "bg-orange-500/10 text-orange-600"
      default:
        return "bg-gray-500/10 text-gray-600"
    }
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reporter.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || report.status === statusFilter
    const matchesType = typeFilter === "all" || report.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flag className="h-8 w-8 text-primary" />
            Manage Reports
          </h1>
          <p className="text-muted-foreground">Review and handle user reports</p>
        </div>
        <Button onClick={fetchReports} variant="outline" className="gap-2 bg-transparent">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="LISTING">Listing</SelectItem>
                <SelectItem value="TRANSACTION">Transaction</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="DISMISSED">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>User-submitted reports requiring review</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report, index) => (
                  <motion.tr
                    key={report.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b"
                  >
                    <TableCell className="font-mono text-sm">{report.id}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(report.type)}>{report.type}</Badge>
                    </TableCell>
                    <TableCell>{report.reason}</TableCell>
                    <TableCell>{report.reporter.username}</TableCell>
                    <TableCell>{report.reported?.username || report.listing?.title || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedReport(report)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>Review and take action on this report</DialogDescription>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Report ID</p>
                  <p className="font-mono">{selectedReport.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge className={getTypeColor(selectedReport.type)}>{selectedReport.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <p>{selectedReport.reason}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reporter</p>
                  <p>{selectedReport.reporter.username}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="p-3 bg-muted/50 rounded-lg text-sm">{selectedReport.description}</p>
              </div>
              {selectedReport.status === "PENDING" && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Resolution Notes</p>
                    <Textarea
                      placeholder="Add notes about the resolution..."
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => handleResolveReport("dismiss")}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Dismiss
                    </Button>
                    <Button onClick={() => handleResolveReport("action_taken")}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Take Action
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
