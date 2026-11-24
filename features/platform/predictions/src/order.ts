import type { PredictionsTypedData } from "./typedData";

export type PredictionsOrderAnswer = {
  signature: string;
  /** Reports name it, so a late report can't reach a newer order. */
  walletOrderId: string;
};

/** Display only, never shown as what the user signs: the device shows the order itself. */
export type PredictionsOrderDisplay = {
  eventTitle?: string;
  marketTitle: string;
  outcomeLabel: string;
  outcomeSide?: "yes" | "no";
  imageUrl?: string;
};

export const PREDICTIONS_ORDER_REJECTION_REASONS = [
  "expired-signature",
  "insufficient-balance",
  "invalid-tick-size",
  "market-closed",
  "not-accepted",
] as const;

export type PredictionsOrderRejectionReason = (typeof PREDICTIONS_ORDER_REJECTION_REASONS)[number];

export type PredictionsOrderReport =
  | { status: "filled"; shares: number; price: number }
  | { status: "filled" }
  | { status: "not-filled" }
  | { status: "rejected"; reason: PredictionsOrderRejectionReason }
  | { status: "unconfirmed" };

export type PredictionsOrderAction = "close" | "retry";

/** The USD amount the user pays, as signed: MoonPay's `amount` is scaled to 6 decimals. */
export function placeOrderAmountUsd({ message }: PredictionsTypedData): number {
  return Number(message.amount) / 1_000_000;
}
