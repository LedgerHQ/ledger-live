import { updateTransaction as defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "./types";

export const updateTransaction: AccountBridge<Transaction>["updateTransaction"] = (tx, patch) => {
  if (
    ("mode" in patch && patch.mode !== tx.mode) ||
    ("validators" in patch && patch.validators?.length !== tx.validators.length)
  ) {
    patch = { ...patch, gas: null, fees: null };
  }

  return defaultUpdateTransaction(tx, patch);
};

export default updateTransaction;
