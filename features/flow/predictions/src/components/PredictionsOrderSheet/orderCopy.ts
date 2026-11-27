import type {
  PredictionsOrderDisplay,
  PredictionsOrderReport,
  PredictionsOrderRejectionReason,
} from "@features/platform-predictions";
import type { PredictionsOrderDetails } from "../../predictionsOrderStore.internals";

export type OrderSide = PredictionsOrderDetails["side"];

const COPY_SCOPES = { buy: "order", sale: "sale" } as const satisfies Record<OrderSide, string>;

export type OrderCopyScope = (typeof COPY_SCOPES)[OrderSide];

export function orderCopyScope(side: OrderSide): OrderCopyScope {
  return COPY_SCOPES[side];
}

type OrderTitleKey = `predictions.${OrderCopyScope}.${
  | "placing"
  | "filled.title"
  | "notFilled.title"
  | "rejected.title"
  | "unconfirmed.title"}`;

export function orderTitleKey(
  side: OrderSide,
  report: PredictionsOrderReport | null,
): OrderTitleKey {
  const scope = orderCopyScope(side);
  if (report === null) return `predictions.${scope}.placing`;
  switch (report.status) {
    case "filled":
      return `predictions.${scope}.filled.title`;
    case "not-filled":
      return `predictions.${scope}.notFilled.title`;
    case "rejected":
      return `predictions.${scope}.rejected.title`;
    case "unconfirmed":
      return `predictions.${scope}.unconfirmed.title`;
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
