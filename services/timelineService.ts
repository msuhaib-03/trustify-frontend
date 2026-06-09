// ========================================================
// TIMELINE SERVICE
// ========================================================
// Handles transaction timeline/history API calls.
// ========================================================

import apiClient from "@/api/client"

// Use mock API flag
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === "true"

// ========================================================
// TYPE DEFINITIONS
// ========================================================

export type TimelineEventType =
  | "TRANSACTION_CREATED"
  | "ESCROW_AUTHORIZED"
  | "CONDITIONS_ACCEPTED"
  | "RENTAL_STARTED"
  | "RENTAL_COMPLETED"
  | "DISPUTE_RAISED"
  | "DISPUTE_RESOLVED"
  | "REFUND_PROCESSED"
  | "ESCROW_RELEASED"
  | "DAMAGE_DEDUCTED"
  | "PAYMENT_RECEIVED"
  | "STATUS_CHANGED"

export interface TimelineEvent {
  id: string
  transactionId: string
  eventType: TimelineEventType
  description: string
  timestamp: string
  performedBy?: string
  performedByName?: string
  metadata?: Record<string, unknown>
}

// ========================================================
// MOCK TIMELINE DATA
// ========================================================

const generateMockTimeline = (transactionId: string): TimelineEvent[] => {
  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() - 7)

  return [
    {
      id: `evt-${transactionId}-1`,
      transactionId,
      eventType: "TRANSACTION_CREATED",
      description: "Transaction was created",
      timestamp: baseDate.toISOString(),
      performedBy: "system",
    },
    {
      id: `evt-${transactionId}-2`,
      transactionId,
      eventType: "ESCROW_AUTHORIZED",
      description: "Escrow payment authorized and held",
      timestamp: new Date(baseDate.getTime() + 3600000).toISOString(),
      performedBy: "buyer",
    },
    {
      id: `evt-${transactionId}-3`,
      transactionId,
      eventType: "CONDITIONS_ACCEPTED",
      description: "Rental conditions accepted by both parties",
      timestamp: new Date(baseDate.getTime() + 7200000).toISOString(),
      performedBy: "seller",
    },
    {
      id: `evt-${transactionId}-4`,
      transactionId,
      eventType: "RENTAL_STARTED",
      description: "Rental period has started",
      timestamp: new Date(baseDate.getTime() + 86400000).toISOString(),
      performedBy: "system",
    },
  ]
}

// ========================================================
// TIMELINE SERVICE IMPLEMENTATION
// ========================================================

export const timelineService = {
  // GET /timeline/{transactionId}
  getTransactionTimeline: async (transactionId: string): Promise<{ data: TimelineEvent[] }> => {
    if (USE_MOCK) {
      // Return mock timeline data
      await new Promise((resolve) => setTimeout(resolve, 300))
      return { data: generateMockTimeline(transactionId) }
    }

    const response = await apiClient.get<TimelineEvent[]>(`/timeline/${transactionId}`)
    return { data: response.data }
  },

  // Add timeline event (internal use)
  addEvent: async (
    transactionId: string,
    eventType: TimelineEventType,
    description: string
  ): Promise<{ data: TimelineEvent }> => {
    if (USE_MOCK) {
      const event: TimelineEvent = {
        id: `evt-${Date.now()}`,
        transactionId,
        eventType,
        description,
        timestamp: new Date().toISOString(),
        performedBy: "system",
      }
      return { data: event }
    }

    const response = await apiClient.post<TimelineEvent>(`/timeline/${transactionId}`, {
      eventType,
      description,
    })
    return { data: response.data }
  },
}

export default timelineService
