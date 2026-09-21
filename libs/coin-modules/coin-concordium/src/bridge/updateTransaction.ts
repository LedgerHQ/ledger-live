import { updateTransaction as defaultUpdateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";

/**
 * Drops the estimate on every patch, so `prepareTransaction` re-prices whatever
 * the user is now describing.
 *
 * `fee` and `energy` are two halves of one estimate and expire together. Energy
 * is priced from the token id's byte length and the operations blob's size, so a
 * leftover value would be signed as the limit for a different token.
 *
 * `energy` is dropped rather than set to `undefined`: `exactOptionalPropertyTypes`
 * forbids the explicit value, and the spread in `defaultUpdateTransaction` keeps
 * the previous number if the key is merely absent from the patch.
 */
export const updateTransaction: AccountBridge<Transaction>["updateTransaction"] = (tx, patch) => {
  const updated = defaultUpdateTransaction(tx, { ...patch, fee: null });

  // `defaultUpdateTransaction` returns `tx` itself when the patch changes
  // nothing, and `useBridgeTransaction` compares by identity: allocating anyway
  // would flip `bridgePending` on a no-op patch and re-run preparation, costing
  // a fee round-trip.
  if (!("energy" in updated)) return updated;

  const { energy: _stale, ...withoutEnergy } = updated;
  return withoutEnergy;
};
