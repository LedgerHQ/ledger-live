import type {
  PredictionsOrderDisplay,
  PredictionsOrderOutcome,
  PredictionsOrderRejectionReason,
} from "@features/platform-predictions";

type OrderTitleKey =
  | "predictions.order.placing"
  | "predictions.order.filled.title"
  | "predictions.order.notFilled.title"
  | "predictions.order.rejected.title"
  | "predictions.order.unconfirmed.title";

export function orderTitleKey(outcome: PredictionsOrderOutcome | null): OrderTitleKey {
  if (outcome === null) return "predictions.order.placing";
  switch (outcome.outcome) {
    case "filled":
      return "predictions.order.filled.title";
    case "not-filled":
      return "predictions.order.notFilled.title";
    case "rejected":
      return "predictions.order.rejected.title";
    case "unconfirmed":
      return "predictions.order.unconfirmed.title";
  }
}

// A fresh quote and a new signature can get these through; the others need the user to act first.
const RETRYABLE_REJECTIONS: ReadonlySet<PredictionsOrderRejectionReason> = new Set([
  "expired-signature",
  "invalid-tick-size",
  "workflow-failed",
]);

export function canRetryOrder(outcome: PredictionsOrderOutcome): boolean {
  switch (outcome.outcome) {
    case "not-filled":
      return true;
    case "rejected":
      return RETRYABLE_REJECTIONS.has(outcome.reason);
    case "filled":
    case "unconfirmed":
      return false;
  }
}

const SHARE_DIGITS = 2;

/**
 * Rounded as shown, so a plural picked from it agrees with the number on screen. Intl rounds like
 * `formatShares`, where `toFixed` would turn 1.005 into 1.00 while the screen says 1.01.
 */
export function displayedShares(shares: number): number {
  return Number(
    new Intl.NumberFormat("en-US", {
      maximumFractionDigits: SHARE_DIGITS,
      useGrouping: false,
    }).format(shares),
  );
}

export function formatShares(language: string, shares: number): string {
  return new Intl.NumberFormat(language, { maximumFractionDigits: SHARE_DIGITS }).format(shares);
}

/** Yes in green and No in red, like the live app's side switch; any other outcome neutral. */
export function outcomeTagAppearance({
  outcomeSide,
}: PredictionsOrderDisplay): "success" | "error" | "gray" {
  switch (outcomeSide) {
    case "yes":
      return "success";
    case "no":
      return "error";
    case undefined:
      return "gray";
  }
}

export function formatUsd(language: string, amount: number): string {
  return new Intl.NumberFormat(language, { style: "currency", currency: "USD" }).format(amount);
}
