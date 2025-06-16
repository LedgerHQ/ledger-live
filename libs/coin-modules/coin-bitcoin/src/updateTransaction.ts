import { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction as defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Transaction } from "./types";

export const updateTransaction: AccountBridge<Transaction>["updateTransaction"] = (tx, patch) => {
  const updatedT = defaultUpdateTransaction(tx, patch);

  // We accept case-insensitive addresses as input from user,
  // but segwit addresses need to be converted to lowercase to be valid
  if (updatedT.recipient.toLowerCase().indexOf("bc1") === 0) {
    updatedT.recipient = updatedT.recipient.toLowerCase();
  }

  return updatedT;
};

export default updateTransaction;
