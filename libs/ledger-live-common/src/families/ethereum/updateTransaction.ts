import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "./types";

export const updateTransaction: AccountBridge<Transaction>["updateTransaction"] =
  (tx, patch) => {
    if ("recipient" in patch && patch.recipient !== tx.recipient) {
      return { ...tx, ...patch, userGasLimit: null, estimatedGasLimit: null };
    }

    return { ...tx, ...patch };
  };

export default updateTransaction;
