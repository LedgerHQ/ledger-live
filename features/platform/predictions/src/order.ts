import { parseURL } from "./webviewInputs";

export type PredictionsOrderAnswer = {
  /** 0x-prefixed hex. */
  signature: string;
  /** What the live app reports this order's outcome with, so a late report can't reach another. */
  orderId: string;
};

/**
 * What the order sheet shows about the market, as the live app declares it: display only, never
 * what the user signs (the device shows the order itself). `imageUrl` is only kept on an allowed host.
 */
export type PredictionsOrderDisplay = {
  /** The event's title, when `marketTitle` is one of its markets (e.g. "↑$4.0T"). */
  eventTitle?: string;
  /** The market: its question, or its name within `eventTitle`. */
  marketTitle: string;
  outcomeLabel: string;
  /** Yes or No of a binary market, which the sheet colours; none for an outcome like "France". */
  outcomeSide?: "yes" | "no";
  imageUrl?: string;
};

/** Hosts the order sheet loads market images from: anything else would let a live app make Ledger Wallet fetch any URL. */
const PREDICTIONS_IMAGE_HOSTS: ReadonlySet<string> = new Set([
  "polymarket-upload.s3.us-east-2.amazonaws.com",
]);

/** `https`, on an allowed host, with no port or user info. */
export function isAllowedPredictionsImageUrl(imageUrl: string): boolean {
  const url = parseURL(imageUrl);
  return (
    url?.protocol === "https:" &&
    PREDICTIONS_IMAGE_HOSTS.has(url.host) &&
    url.username === "" &&
    url.password === ""
  );
}

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
