import type {
  Transaction as ZcashTransaction,
  ZcashTransferType,
} from "@ledgerhq/coin-zcash/types";
import type { CoinDescriptor } from "../../../bridge/descriptor/types";
import { zcashBalanceTypeConfig } from "./balanceType";
import { memo } from "./memo";

type ZcashTransferFlow =
  | "public-to-public"
  | "public-to-private"
  | "private-to-public"
  | "private-to-private";

export type ZcashPrivacyAttributes = Readonly<{
  privacy: "public" | "private";
  transferFlow?: ZcashTransferFlow;
}>;

/**
 * Chain-neutral privacy attributes of a Zcash send. The send-flow page events read them
 * through `getTrackingAttributes` below; any other analytics sink reporting a Zcash
 * send's privacy should reuse this mapping rather than derive its own. Named
 * `transferFlow` rather than the generic `flow`: every send-flow Segment event already
 * carries a `flow: "send"` property (the funnel name), and this would silently
 * overwrite it.
 */
const TRANSFER_FLOW_BY_TRANSFER_TYPE: Record<ZcashTransferType, ZcashTransferFlow> = {
  transparent: "public-to-public",
  "transparent-to-shielded": "public-to-private",
  "shielded-to-transparent": "private-to-public",
  shielded: "private-to-private",
};

function isZcashSendTransaction(
  transaction: unknown,
): transaction is Pick<ZcashTransaction, "family" | "sender" | "recipientType" | "transferType"> {
  if (typeof transaction !== "object" || transaction === null) return false;
  return "family" in transaction && transaction.family === "zcash";
}

/**
 * `undefined` until the user has picked a source pool (`sender`): before that,
 * `transferType` defaults to "transparent" without reflecting an actual choice.
 * `transferFlow` additionally waits for the recipient to be classified
 * (`recipientType`): the balance-type step comes before the recipient step, and until
 * then `transferType` assumes a same-pool send whatever the eventual destination.
 */
export function getPrivacyAttributes(transaction: unknown): ZcashPrivacyAttributes | undefined {
  if (!isZcashSendTransaction(transaction) || !transaction.sender) return undefined;
  if (!transaction.recipientType) return { privacy: transaction.sender };
  return {
    privacy: transaction.sender,
    transferFlow: TRANSFER_FLOW_BY_TRANSFER_TYPE[transaction.transferType],
  };
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
