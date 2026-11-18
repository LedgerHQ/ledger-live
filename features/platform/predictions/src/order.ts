export type PredictionsOrderAnswer = {
  /** 0x-prefixed hex. */
  signature: string;
  /** What the live app reports this order's outcome with, so a late report can't reach another. */
  orderId: string;
};

/** Why MoonPay refused the order, as the live app reports it. */
export const PREDICTIONS_ORDER_REJECTION_REASONS = [
  "expired-signature",
  "insufficient-balance",
  "invalid-tick-size",
  "market-closed",
  "workflow-failed",
] as const;

export type PredictionsOrderRejectionReason = (typeof PREDICTIONS_ORDER_REJECTION_REASONS)[number];

/** How the signed order ended, as the live app reports it. */
export type PredictionsOrderOutcome =
  | { outcome: "filled"; shares: number; price: number }
  | { outcome: "filled" }
  | { outcome: "not-filled" }
  | { outcome: "rejected"; reason: PredictionsOrderRejectionReason }
  | { outcome: "unconfirmed" };

/** What the user picked on the order's outcome: `retry` signs a new order on a fresh quote. */
export type PredictionsOrderAction = "close" | "retry";
