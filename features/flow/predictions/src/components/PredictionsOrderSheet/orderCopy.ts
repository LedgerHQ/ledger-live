import type {
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

export function formatFill(
  language: string,
  { shares, price }: Readonly<{ shares: number; price: number }>,
): Readonly<{ shares: string; price: string }> {
  return {
    shares: new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(shares),
    price: new Intl.NumberFormat(language, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 3,
    }).format(price),
  };
}
