// AI/ML Fraud Detection API - Mock Implementation
// These are mock endpoints that will be replaced with real backend APIs

export interface FraudAnalysisResult {
  transactionId: string
  riskScore: number // 0-100
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  fraudProbability: number // 0-1
  classification: "LEGITIMATE" | "SUSPICIOUS" | "FRAUDULENT"
  confidence: number // 0-1
  factors: FraudFactor[]
  recommendation: string
  analyzedAt: string
}

export interface FraudFactor {
  name: string
  weight: number
  description: string
  impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL"
}

export interface UserRiskProfile {
  userId: string
  overallRiskScore: number
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  accountAge: number // days
  totalTransactions: number
  successfulTransactions: number
  disputedTransactions: number
  flaggedActivity: boolean
  verificationStatus: "UNVERIFIED" | "PARTIAL" | "VERIFIED"
  lastAnalyzed: string
  riskFactors: FraudFactor[]
}

export interface ListingRiskAnalysis {
  listingId: string
  riskScore: number
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  priceAnomaly: boolean
  duplicateDetected: boolean
  suspiciousPatterns: string[]
  imageAnalysis: {
    authentic: boolean
    confidence: number
  }
  textAnalysis: {
    suspicious: boolean
    flaggedPhrases: string[]
  }
  analyzedAt: string
}

export interface FraudReport {
  id: string
  type: "USER" | "LISTING" | "TRANSACTION"
  targetId: string
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
  status: "PENDING" | "REVIEWED" | "RESOLVED" | "FALSE_POSITIVE"
  description: string
  factors: FraudFactor[]
  createdAt: string
  reviewedAt?: string
  resolvedAt?: string
  adminNotes?: string
}

// Mock data generators
const generateRiskFactors = (): FraudFactor[] => {
  const factors: FraudFactor[] = [
    { name: "Account Age", weight: 0.15, description: "Account created recently", impact: "NEGATIVE" },
    { name: "Transaction Velocity", weight: 0.2, description: "Normal transaction frequency", impact: "POSITIVE" },
    { name: "Price Pattern", weight: 0.25, description: "Price within normal range", impact: "POSITIVE" },
    { name: "Geolocation", weight: 0.1, description: "Consistent login location", impact: "POSITIVE" },
    { name: "Device Fingerprint", weight: 0.15, description: "Known device", impact: "POSITIVE" },
    { name: "Behavioral Pattern", weight: 0.15, description: "Activity matches historical pattern", impact: "NEUTRAL" },
  ]
  return factors.slice(0, Math.floor(Math.random() * 4) + 3)
}

const getRiskLevel = (score: number): "LOW" | "MEDIUM" | "HIGH" => {
  if (score < 30) return "LOW"
  if (score < 70) return "MEDIUM"
  return "HIGH"
}

const getClassification = (score: number): "LEGITIMATE" | "SUSPICIOUS" | "FRAUDULENT" => {
  if (score < 30) return "LEGITIMATE"
  if (score < 70) return "SUSPICIOUS"
  return "FRAUDULENT"
}

// Mock API functions
export const mockFraudAPI = {
  // Analyze a transaction for fraud
  analyzeTransaction: async (transactionId: string): Promise<FraudAnalysisResult> => {
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API delay

    const riskScore = Math.floor(Math.random() * 100)
    const fraudProbability = riskScore / 100
    const confidence = 0.7 + Math.random() * 0.25

    return {
      transactionId,
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      fraudProbability,
      classification: getClassification(riskScore),
      confidence,
      factors: generateRiskFactors(),
      recommendation:
        riskScore < 30
          ? "Transaction appears legitimate. Proceed normally."
          : riskScore < 70
            ? "Transaction flagged for review. Manual verification recommended."
            : "High risk transaction. Immediate review required.",
      analyzedAt: new Date().toISOString(),
    }
  },

  // Get user risk profile
  getUserRiskScore: async (userId: string): Promise<UserRiskProfile> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const riskScore = Math.floor(Math.random() * 100)

    return {
      userId,
      overallRiskScore: riskScore,
      riskLevel: getRiskLevel(riskScore),
      accountAge: Math.floor(Math.random() * 365) + 1,
      totalTransactions: Math.floor(Math.random() * 50),
      successfulTransactions: Math.floor(Math.random() * 45),
      disputedTransactions: Math.floor(Math.random() * 3),
      flaggedActivity: riskScore > 70,
      verificationStatus: riskScore < 30 ? "VERIFIED" : riskScore < 70 ? "PARTIAL" : "UNVERIFIED",
      lastAnalyzed: new Date().toISOString(),
      riskFactors: generateRiskFactors(),
    }
  },

  // Analyze listing for fraud
  getListingRisk: async (listingId: string): Promise<ListingRiskAnalysis> => {
    await new Promise((resolve) => setTimeout(resolve, 1200))

    const riskScore = Math.floor(Math.random() * 100)
    const priceAnomaly = riskScore > 60
    const duplicateDetected = riskScore > 75

    return {
      listingId,
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      priceAnomaly,
      duplicateDetected,
      suspiciousPatterns: riskScore > 50 ? ["Unusual pricing pattern", "Multiple similar listings detected"] : [],
      imageAnalysis: {
        authentic: riskScore < 50,
        confidence: 0.8 + Math.random() * 0.15,
      },
      textAnalysis: {
        suspicious: riskScore > 60,
        flaggedPhrases: riskScore > 60 ? ["urgently", "too good to be true"] : [],
      },
      analyzedAt: new Date().toISOString(),
    }
  },

  // Get fraud reports
  getFraudReports: async (
    page = 0,
    size = 10,
  ): Promise<{ content: FraudReport[]; totalElements: number; totalPages: number }> => {
    await new Promise((resolve) => setTimeout(resolve, 800))

    const reports: FraudReport[] = Array.from({ length: size }, (_, i) => {
      const riskScore = Math.floor(Math.random() * 100)
      const types: Array<"USER" | "LISTING" | "TRANSACTION"> = ["USER", "LISTING", "TRANSACTION"]
      const statuses: Array<"PENDING" | "REVIEWED" | "RESOLVED" | "FALSE_POSITIVE"> = [
        "PENDING",
        "REVIEWED",
        "RESOLVED",
        "FALSE_POSITIVE",
      ]

      return {
        id: `FR-${(page * size + i + 1).toString().padStart(6, "0")}`,
        type: types[Math.floor(Math.random() * types.length)],
        targetId: `TARGET-${Math.random().toString(36).slice(2, 10)}`,
        riskLevel: getRiskLevel(riskScore),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        description: `Suspicious activity detected with ${getRiskLevel(riskScore).toLowerCase()} risk level`,
        factors: generateRiskFactors(),
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt:
          Math.random() > 0.5
            ? new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
        resolvedAt:
          Math.random() > 0.7
            ? new Date(Date.now() - Math.random() * 1 * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
      }
    })

    return {
      content: reports,
      totalElements: 47,
      totalPages: 5,
    }
  },

  // Flag a user
  flagUser: async (userId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return {
      success: true,
      message: `User ${userId} has been flagged for: ${reason}`,
    }
  },
}
