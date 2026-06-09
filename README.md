# Trustify — Escrow Marketplace for Pakistan

A full-stack peer-to-peer marketplace built for the Pakistani market, featuring real escrow payments, fraud detection, rental management, and a full admin dashboard.

---

## What it does

Trustify lets users **buy, sell, and rent items** with their money held safely in escrow until the transaction is confirmed. No upfront trust required — the platform enforces it.

- **Buyers** pay via Stripe; funds are held and only released when they confirm receipt/return
- **Sellers** list items for sale or rent; payment is captured only after delivery or rental return
- **Disputes** are escalated to admin who can issue full/partial refunds or release to seller
- **Fraud scores** are calculated per user and high-risk accounts are flagged for manual review
- **CNIC verification** gates all transactions — unverified users cannot buy or rent

---

## Features

### Marketplace
- Sale and rental listings with image upload (AWS S3)
- Rental duration picker (per hour / per day) with live price calculation
- Listing status lifecycle — `ACTIVE → RENTED/SOLD` automatically on transaction
- Search, filter by category, price cap, and listing type

### Payments & Escrow
- Stripe PaymentIntent with **manual capture** — funds held until buyer confirms
- Deposit system for rentals — auto-released on clean return, partially deducted on damage
- Partial capture for damage deduction (Stripe handles deposit release automatically)
- Force-complete endpoint for stuck transactions

### Trust & Safety
- Per-user fraud score (0–100) updated on disputes and transaction behaviour
- Trust rating displayed on profiles and listing cards
- CNIC (national ID) verification before any transaction
- Admin fraud-detection dashboard with high-risk user list

### Dispute Resolution
- Buyers open disputes from transaction detail page
- Admin panel to resolve: full refund, release to seller, partial refund, or status-only update
- Stripe action (cancel PI or issue refund) fired server-side on resolution

### Admin Dashboard
- Live stats: revenue, active listings, pending disputes, total users
- Monthly revenue chart (Recharts) wired to real transaction data
- System health monitor: JVM memory, DB load, fraud rate, AI accuracy
- Recent activity feed: merged transactions + disputes + high-risk events
- User management: suspend accounts, view fraud scores

### Accounts & Profiles
- JWT authentication (Spring Security)
- Profile page with live account stats (active listings, completed sales, rentals)
- Password update endpoint (`PUT /users/me/password`)
- Chat with any seller directly from a listing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI Components | shadcn/ui, Radix UI, Framer Motion |
| Charts | Recharts |
| Payments | Stripe (PaymentIntents, manual capture, partial capture, refunds) |
| Backend | Spring Boot 3.x, Spring Security, JWT |
| Database | MongoDB (via Spring Data MongoDB) |
| File Storage | AWS S3 |
| Email | JavaMailSender (SMTP) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Spring Boot backend running on `http://localhost:8080`
- Stripe account (test mode keys)

### Install & run

```bash
git clone https://github.com/msuhaib-03/trustify-frontend.git
cd trustify-frontend
npm install
cp .env.example .env.local   # then fill in your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment variables

```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Project Structure

```
app/
  (dashboard)/          # Authenticated user routes
    listings/           # Browse, listing detail
    transactions/       # Checkout, transaction detail, history
    profile/            # User profile, security settings
    messages/           # Chat
  admin/                # Admin-only dashboard and tools
    fraud-detection/
    disputes/
lib/
  api.ts                # All API calls (one source of truth)
  stripe.ts             # Stripe.js loader
  currency.ts           # USD ↔ PKR helpers
components/
  stripe-payment-form   # Stripe Elements card form
  verification-required-modal
  back-button
services/
  chat/                 # Chat API and message resolution
```

---

## Key flows

**Rental flow**
```
Buyer selects duration → Checkout (Stripe PI created) →
Card payment authorized → Listing marked RENTED →
Seller confirms pickup → Rental in progress →
Buyer returns item → Seller finalizes (damage or clean) →
Stripe captured → Listing back to ACTIVE
```

**Sale flow**
```
Buyer checks out → PI authorized → Seller ships →
Buyer confirms receipt → PI captured → Listing marked SOLD
```

**Dispute flow**
```
Buyer opens dispute → Admin reviews evidence →
Admin: refund_buyer (cancel/refund PI) or release_to_seller (capture PI) →
Listing status restored accordingly
```

---

## Backend

Backend repo: private — Spring Boot 3 / MongoDB / Stripe / AWS S3

---

*Built as a final year project — fully wired, no mocks in production.*
