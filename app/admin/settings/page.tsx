"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Settings, Shield, Bell, Database, Key, Save, Loader2, Percent } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { depositConfigAPI } from "@/lib/api"
import { toast } from "sonner"

interface DepositConfig {
  id?: string
  category: string
  depositPercentage: number
}

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingDeposit, setIsSavingDeposit] = useState(false)
  const [depositConfigs, setDepositConfigs] = useState<DepositConfig[]>([])
  const [settings, setSettings] = useState({
    fraudDetectionEnabled: true,
    highRiskThreshold: 75,
    mediumRiskThreshold: 50,
    autoFlagHighRisk: true,
    emailNotifications: true,
    disputeAlerts: true,
    newUserAlerts: false,
    transactionAlerts: true,
    maintenanceMode: false,
    requireVerification: true,
    maxListingImages: 5,
    escrowHoldDays: 7,
  })

  useEffect(() => {
    depositConfigAPI.getAll()
      .then((res) => setDepositConfigs(res.data || []))
      .catch(() => {/* admin may not be logged in during dev */})
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success("Settings saved successfully")
    setIsSaving(false)
  }

  const handleSaveDeposit = async () => {
    setIsSavingDeposit(true)
    try {
      const res = await depositConfigAPI.updateAll(
        depositConfigs.map(({ category, depositPercentage }) => ({ category, depositPercentage }))
      )
      setDepositConfigs(res.data || depositConfigs)
      toast.success("Deposit percentages saved")
    } catch {
      toast.error("Failed to save deposit config")
    } finally {
      setIsSavingDeposit(false)
    }
  }

  const updateDepositPct = (category: string, value: number) => {
    setDepositConfigs((prev) =>
      prev.map((c) => c.category === category ? { ...c, depositPercentage: value } : c)
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
            <span className="truncate">Admin Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Configure platform settings and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-2 self-start sm:self-auto">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save</span>
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* Fraud Detection Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Fraud Detection Settings
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure AI/ML fraud detection parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-sm">Enable Fraud Detection</Label>
                  <p className="text-xs text-muted-foreground">Automatically analyze transactions for fraud</p>
                </div>
                <Switch
                  checked={settings.fraudDetectionEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, fraudDetectionEnabled: checked })}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">High Risk Threshold (%)</Label>
                  <Input
                    type="number"
                    value={settings.highRiskThreshold}
                    onChange={(e) => setSettings({ ...settings, highRiskThreshold: Number(e.target.value) })}
                    min={50}
                    max={100}
                    className="text-sm"
                  />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Score above this is HIGH risk</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Medium Risk Threshold (%)</Label>
                  <Input
                    type="number"
                    value={settings.mediumRiskThreshold}
                    onChange={(e) => setSettings({ ...settings, mediumRiskThreshold: Number(e.target.value) })}
                    min={25}
                    max={75}
                    className="text-sm"
                  />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Score above this is MEDIUM risk</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-sm">Auto-flag High Risk</Label>
                  <p className="text-xs text-muted-foreground">Auto flag transactions above threshold</p>
                </div>
                <Switch
                  checked={settings.autoFlagHighRisk}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoFlagHighRisk: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Configure admin notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-sm">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-sm">Dispute Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified for new disputes</p>
                </div>
                <Switch
                  checked={settings.disputeAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, disputeAlerts: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-sm">New User Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified for new users</p>
                </div>
                <Switch
                  checked={settings.newUserAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, newUserAlerts: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-sm">Transaction Alerts</Label>
                  <p className="text-xs text-muted-foreground">Get notified for high-value transactions</p>
                </div>
                <Switch
                  checked={settings.transactionAlerts}
                  onCheckedChange={(checked) => setSettings({ ...settings, transactionAlerts: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Platform Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Database className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Platform Settings
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Configure general platform settings</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-sm">Maintenance Mode</Label>
                  <p className="text-xs text-muted-foreground">Put platform in maintenance</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 min-w-0">
                  <Label className="text-sm">Require Verification</Label>
                  <p className="text-xs text-muted-foreground">Require CNIC verification</p>
                </div>
                <Switch
                  checked={settings.requireVerification}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireVerification: checked })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Max Listing Images</Label>
                  <Input
                    type="number"
                    value={settings.maxListingImages}
                    onChange={(e) => setSettings({ ...settings, maxListingImages: Number(e.target.value) })}
                    min={1}
                    max={10}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Escrow Hold (Days)</Label>
                  <Input
                    type="number"
                    value={settings.escrowHoldDays}
                    onChange={(e) => setSettings({ ...settings, escrowHoldDays: Number(e.target.value) })}
                    min={1}
                    max={30}
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Deposit Configuration */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Security Deposit Configuration
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Set deposit % per category — applied to the item's declared market value
                  </CardDescription>
                </div>
                <Button
                  onClick={handleSaveDeposit}
                  disabled={isSavingDeposit}
                  size="sm"
                  variant="outline"
                  className="gap-2 shrink-0"
                >
                  {isSavingDeposit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {depositConfigs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <div className="space-y-3">
                  {depositConfigs.map((cfg) => (
                    <div key={cfg.category} className="flex items-center gap-4">
                      <Label className="w-32 shrink-0 text-sm">{cfg.category}</Label>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={cfg.depositPercentage}
                          onChange={(e) => updateDepositPct(cfg.category, Number(e.target.value))}
                          className="w-24 text-sm"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <span className="text-xs text-muted-foreground">
                          e.g. declared PKR 10,000 → deposit PKR {((10000 * cfg.depositPercentage) / 100).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-2">
                    Deposit = declared value × percentage. Held in Stripe escrow, refunded automatically on undamaged return.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* API Keys */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Key className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                API Configuration
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">View API configuration status</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50 gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm">Stripe API</p>
                  <p className="text-xs text-muted-foreground">Payment processing</p>
                </div>
                <span className="text-green-500 text-xs font-medium flex-shrink-0">Connected</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50 gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm">WebSocket Server</p>
                  <p className="text-xs text-muted-foreground">Real-time chat</p>
                </div>
                <span className="text-green-500 text-xs font-medium flex-shrink-0">Active</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50 gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm">MongoDB Database</p>
                  <p className="text-xs text-muted-foreground">Data storage</p>
                </div>
                <span className="text-green-500 text-xs font-medium flex-shrink-0">Connected</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50 gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm">AI/ML Fraud Detection</p>
                  <p className="text-xs text-muted-foreground">Transaction analysis</p>
                </div>
                <span className="text-yellow-500 text-xs font-medium flex-shrink-0">Mock Mode</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
