export type PredictionsOrderAnswer = {
  signature: string;
  /** Reports name it, so a late report can't reach a newer order. */
  walletOrderId: string;
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
