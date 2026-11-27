import { z } from "zod";
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
  /** A sale: `received` is the USD it paid out. */
  | { status: "filled"; shares: number; received: number }
  | { status: "filled" }
  | { status: "not-filled" }
  | { status: "rejected"; reason: PredictionsOrderRejectionReason }
  | { status: "unconfirmed" };

export type PredictionsOrderAction = "close" | "retry";

const AMOUNT_SCALE = 1_000_000;

/** The USD amount the user pays, as signed: MoonPay's `amount` is scaled to 6 decimals. */
export function placeOrderAmountUsd({ message }: PredictionsTypedData): number {
  return Number(message.amount) / AMOUNT_SCALE;
}

export function sellPositionShares({ message }: PredictionsTypedData): number {
  return Number(message.amount) / AMOUNT_SCALE;
}

export function isSellPosition({ primaryType }: PredictionsTypedData): boolean {
  return primaryType === "SellPosition";
}

/** The report, once it fits the signed order: the sheet shows a buy's `price` and a sale's `received` only. */
export function orderReportFor(
  typedData: PredictionsTypedData,
  report: PredictionsOrderReport,
): PredictionsOrderReport {
  const side = isSellPosition(typedData) ? "sale" : "buy";
  const otherSideField = side === "sale" ? "price" : "received";
  // A ZodError reaches the live app as INVALID_PARAMS.
  return z
    .custom<PredictionsOrderReport>()
    .refine(fitted => !(otherSideField in fitted), {
      message: `A ${side} isn't reported with a ${otherSideField}`,
    })
    .parse(report);
}
