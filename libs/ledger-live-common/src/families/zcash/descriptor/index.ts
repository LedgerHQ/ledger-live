import type {
  Transaction as ZcashTransaction,
  ZcashTransferType,
} from "@ledgerhq/coin-zcash/types";
import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { zcashBalanceTypeConfig } from "./balanceType";
import { memo } from "./memo";

export type ZcashPrivacyAttributes = Readonly<{
  privacy: "public" | "private";
  transferFlow:
    | "public-to-public"
    | "public-to-private"
    | "private-to-public"
    | "private-to-private";
}>;

/**
 * Chain-neutral privacy attributes keyed off `transferType`. The send-flow page events
 * read them through `getTrackingAttributes` below; any other analytics sink reporting a
 * Zcash send's privacy should reuse this mapping rather than derive its own. Named
 * `transferFlow` rather than the generic `flow`: every send-flow Segment event already
 * carries a `flow: "send"` property (the funnel name), and this would silently
 * overwrite it.
 */
const ATTRIBUTES_BY_TRANSFER_TYPE: Record<ZcashTransferType, ZcashPrivacyAttributes> = {
  transparent: { privacy: "public", transferFlow: "public-to-public" },
  "transparent-to-shielded": { privacy: "public", transferFlow: "public-to-private" },
  "shielded-to-transparent": { privacy: "private", transferFlow: "private-to-public" },
  shielded: { privacy: "private", transferFlow: "private-to-private" },
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

// ZIP-317 defines one conventional fee computed from the transaction's action
// layout: no presets, no custom fee, and no coin control. The fee shown is the
// bridge's `status.estimatedFees`, which the descriptor deliberately leaves alone.
export const descriptor: CoinDescriptor = {
  send: {
    inputs: { memo },
    fees: {
      hasPresets: false,
      hasCustom: false,
      hasCoinControl: false,
    },
    selfTransfer: "free",
    balanceType: zcashBalanceTypeConfig,
    getTrackingAttributes: transaction => getPrivacyAttributes(transaction) ?? {},
  },
};
