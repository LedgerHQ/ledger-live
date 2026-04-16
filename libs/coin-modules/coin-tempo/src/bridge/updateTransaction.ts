import { updateTransaction as defaultUpdateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";

export const updateTransaction: AccountBridge<Transaction>["updateTransaction"] = (tx, patch) => {
  return defaultUpdateTransaction(tx, patch);
};
