// src/modules/solana-payment/types.ts

import { PublicKey } from "@solana/web3.js"

export enum PaymentSessionStatus {
  AUTHORIZED = "authorized",
  PENDING = "pending",
  REQUIRES_MORE = "requires_more",
  ERROR = "error",
  CANCELED = "canceled"
}

export type SolanaPaymentOptions = {
  rpcUrl: string
  merchantWallet: string
  usdcMint: string
  usdtMint: string
  webhookSecret?: string
}

export type TokenTransferData = {
  amount: number
  currency: string
  transaction_signature?: string
  customer_wallet?: string
  merchant_wallet: string
  token_mint: string
  status?: PaymentSessionStatus
  error?: string
}

export type WebhookEvent = {
  type: string
  signature: string
  amount: number
  mint: string
  timestamp: number
  error?: string
}
