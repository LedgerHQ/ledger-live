import { Transaction } from "./types";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";

const updateTransaction = (t: Transaction, patch: Partial<Transaction>): Transaction => {
  if ("mode" in patch && patch.mode !== t.mode) {
    return defaultUpdateTransaction(t, { ...patch, gas: null, fees: null });
  }

  if ("validators" in patch && patch.validators?.length !== t.validators.length) {
    return defaultUpdateTransaction(t, { ...patch, gas: null, fees: null });
  }

  return defaultUpdateTransaction(t, patch);
};

export default updateTransaction;
