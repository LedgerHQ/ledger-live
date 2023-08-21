import { Transaction } from "./types";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";

const updateTransaction = (tx: Transaction, patch: Partial<Transaction>): Transaction => {
  if (
    ("mode" in patch && patch.mode !== tx.mode) ||
    ("validators" in patch && patch.validators?.length !== tx.validators.length)
  ) {
    patch = { ...patch, gas: null, fees: null };
  }

  return defaultUpdateTransaction(tx, patch);
};

export default updateTransaction;
