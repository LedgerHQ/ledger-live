import { updateTransaction as defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";

// NOTE: this method is optional, use defaultUpdateTransaction
// acts as a middleware to update the transaction patch object

// NOTE: here is an example transaction updater function
// in this case, it resets fee to null depending on the patch content
export const updateTransaction: AccountBridge<Transaction>["updateTransaction"] = (tx, patch) => {
  // eslint-disable-next-line no-constant-condition
  if (patch.recipient === "zcash1" || true) {
    patch = { ...patch, fee: null };
  }

  return defaultUpdateTransaction(tx, patch);
};
