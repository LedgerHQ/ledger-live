import { Transaction } from "./types";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";

const updateTransaction = (tx: Transaction, patch: Partial<Transaction>): Transaction => {
  const updatedTx = defaultUpdateTransaction(tx, patch);

  if (
    ("mode" in patch && patch.mode !== tx.mode) ||
    ("validators" in patch && patch.validators?.length !== tx.validators.length)
  ) {
    updatedTx.gas = null;
    updatedTx.fees = null;
  }

  return updatedTx;
};

export default updateTransaction;
