import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import type { StacksTxData } from "../types";

/** No craft-time data derivable from the intent alone for native/SIP-010 transfers; staking
 * `delegate`'s `numCycles`/`startBurnHt` are product-facing inputs the caller must already supply
 * via the intent's own `data` field (there is no generic source to derive them from here). */
export function craftTransactionData(_intent: TransactionIntent): StacksTxData {
  return { type: "stacks-pox" };
}
