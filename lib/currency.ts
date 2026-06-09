// Fixed exchange rate: 1 USD = 282 PKR
// Stripe does not support PKR, so all PaymentIntents are charged in USD.
// This file handles the conversion so the UI shows PKR natively to Pakistani users.

const USD_TO_PKR_RATE = 282

/** PKR amount → USD cents for Stripe (e.g., 25000 PKR → 8865 cents = ~$88.65) */
export function pkrToUsdCents(pkrAmount: number): number {
  return Math.round((pkrAmount / USD_TO_PKR_RATE) * 100)
}

/** USD cents → PKR formatted string (e.g., 886500 cents → "25,000") */
export function usdToPkr(amountCents: number): string {
  const pkrAmount = (amountCents / 100) * USD_TO_PKR_RATE
  return pkrAmount.toLocaleString("en-PK", { maximumFractionDigits: 0 })
}

/** PKR amount → formatted string (e.g., 25000 → "Rs. 25,000") */
export function formatPkr(pkrAmount: number): string {
  return `Rs. ${pkrAmount.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`
}

/** USD cents → USD formatted string (e.g., 8865 cents → "$88.65") — for Stripe receipts only */
export function formatUsd(usdAmount: number): string {
  return `$${usdAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function getExchangeRate(): number {
  return USD_TO_PKR_RATE
}
