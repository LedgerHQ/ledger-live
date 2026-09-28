import type {
  Transaction as ZcashTransaction,
  ZcashTransferType,
} from "@ledgerhq/coin-zcash/types";

export type ZcashPrivacyAttributes = Readonly<{
  privacy: "public" | "private";
  flow: "public-to-public" | "public-to-private" | "private-to-public" | "private-to-private";
}>;

/**
 * Chain-neutral privacy/flow attributes keyed off `transferType`, the single
 * source of truth both the Datadog broadcast event and the Segment send-flow
 * page events read, so the two can't diverge.
 */
const ATTRIBUTES_BY_TRANSFER_TYPE: Record<ZcashTransferType, ZcashPrivacyAttributes> = {
  transparent: { privacy: "public", flow: "public-to-public" },
  "transparent-to-shielded": { privacy: "public", flow: "public-to-private" },
  "shielded-to-transparent": { privacy: "private", flow: "private-to-public" },
  shielded: { privacy: "private", flow: "private-to-private" },
};

function isZcashSendTransaction(
  transaction: unknown,
): transaction is Pick<ZcashTransaction, "family" | "sender" | "transferType"> {
  if (typeof transaction !== "object" || transaction === null) return false;
  return "family" in transaction && transaction.family === "zcash";
}

/**
 * `undefined` until the user has picked a source pool (`sender`): before that,
 * `transferType` defaults to "transparent" without reflecting an actual choice,
 * so neither the broadcast event nor a page event should attach it yet.
 */
export function getPrivacyAttributes(transaction: unknown): ZcashPrivacyAttributes | undefined {
  if (!isZcashSendTransaction(transaction) || !transaction.sender) return undefined;
  return ATTRIBUTES_BY_TRANSFER_TYPE[transaction.transferType];
}
