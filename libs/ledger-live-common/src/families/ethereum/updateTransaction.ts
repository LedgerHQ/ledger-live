import { AccountBridge } from "@ledgerhq/types-live";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Transaction } from "./types";

export const updateTransaction: AccountBridge<Transaction>["updateTransaction"] = (tx, patch) => {
  if ("recipient" in patch && patch.recipient !== tx.recipient) {
    patch = { ...patch, userGasLimit: null, estimatedGasLimit: null };
  }

  return defaultUpdateTransaction(tx, patch);
};

export default updateTransaction;
