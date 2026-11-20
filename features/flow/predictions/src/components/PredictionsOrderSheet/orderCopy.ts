import type {
  PredictionsOrderDisplay,
  PredictionsOrderReport,
  PredictionsOrderRejectionReason,
} from "@features/platform-predictions";

type OrderTitleKey =
  | "predictions.order.placing"
  | "predictions.order.filled.title"
  | "predictions.order.notFilled.title"
  | "predictions.order.rejected.title"
  | "predictions.order.unconfirmed.title";

export function orderTitleKey(report: PredictionsOrderReport | null): OrderTitleKey {
  if (report === null) return "predictions.order.placing";
  switch (report.status) {
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
]);

export function canRetryOrder(report: PredictionsOrderReport): boolean {
  switch (report.status) {
    case "not-filled":
      return true;
    case "rejected":
      return RETRYABLE_REJECTIONS.has(report.reason);
    case "filled":
    case "unconfirmed":
      return false;
  }
}

const SHARE_DIGITS = 2;

// Rounded like `formatShares`, so the plural matches the number shown: toFixed rounds 1.005 down.
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
