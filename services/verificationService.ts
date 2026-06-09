// ========================================================
// CNIC VERIFICATION SERVICE
// ========================================================
// Handles CNIC verification API calls for users.
// Admin verification APIs are in adminService.
// ========================================================

import apiClient, { uploadFile } from "@/api/client"
import { mockVerificationService } from "@/services/mockVerificationService"

// Use mock API flag
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true"

// ========================================================
// TYPE DEFINITIONS
// ========================================================

export interface VerificationStatus {
  status: "PENDING" | "VERIFIED" | "REJECTED" | "NOT_SUBMITTED"
  extractedName?: string
  extractedCnicNumber?: string
  frontImageUrl?: string
  backImageUrl?: string
  submittedAt?: string
  reviewedAt?: string
  rejectionReason?: string
}

export interface SubmitVerificationRequest {
  frontImage: File
  backImage: File
}

// ========================================================
// VERIFICATION SERVICE IMPLEMENTATION
// ========================================================

export const verificationService = {
  // POST /cnic-verification/submit
  // Content-Type: multipart/form-data
  submitVerification: async (data: SubmitVerificationRequest): Promise<{ data: { message: string; verificationId: string } }> => {
    if (USE_MOCK) {
      const result = await mockVerificationService.submitVerification({
        frontImage: URL.createObjectURL(data.frontImage),
        backImage: URL.createObjectURL(data.backImage),
        cnicNumber: "00000-0000000-0", // Mock extracted
        fullName: "User Name", // Mock extracted
      })
      return {
        data: {
          message: result.data.message,
          verificationId: result.data.verification.verificationId,
        },
      }
    }

    const formData = new FormData()
    formData.append("frontImage", data.frontImage)
    formData.append("backImage", data.backImage)

    const response = await uploadFile("/cnic-verification/submit", formData)
    return { data: response.data }
  },

  // GET /cnic-verification/getMyStatus
  getMyStatus: async (): Promise<{ data: VerificationStatus }> => {
    if (USE_MOCK) {
      const result = await mockVerificationService.getUserVerification()
      
      if (!result.data) {
        return {
          data: {
            status: "NOT_SUBMITTED",
          },
        }
      }

      return {
        data: {
          status: result.data.overallStatus as VerificationStatus["status"],
          extractedName: result.data.cnicDetails?.fullName,
          extractedCnicNumber: result.data.cnicDetails?.cnicNumber,
          frontImageUrl: result.data.frontImageUrl,
          backImageUrl: result.data.backImageUrl,
          submittedAt: result.data.submittedAt,
          reviewedAt: result.data.reviewedAt,
          rejectionReason: result.data.rejectionReason,
        },
      }
    }

    const response = await apiClient.get<VerificationStatus>("/cnic-verification/getMyStatus")
    return { data: response.data }
  },

  // Check if current user is verified
  isVerified: async (): Promise<boolean> => {
    if (USE_MOCK) {
      const result = await mockVerificationService.isCurrentUserVerified()
      return result.data.verified
    }

    try {
      const response = await verificationService.getMyStatus()
      return response.data.status === "VERIFIED"
    } catch {
      return false
    }
  },
}

export default verificationService
