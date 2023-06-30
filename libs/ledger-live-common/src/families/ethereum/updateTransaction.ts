import { AccountBridge } from "@ledgerhq/types-live";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Transaction } from "./types";

export const updateTransaction: AccountBridge<Transaction>["updateTransaction"] = (tx, patch) => {
  const updatedTx = defaultUpdateTransaction(tx, patch);

  if ("recipient" in patch && patch.recipient !== tx.recipient) {
    updatedTx.userGasLimit = null;
    updatedTx.estimatedGasLimit = null;
  }

  return updatedTx;
};

export default updateTransaction;
