import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { estimateFees } from "../common-logic";
import BigNumber from "bignumber.js";
import { updateTransaction } from "./updateTransaction";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  let fee = transaction.fee;
  if (!fee || fee.eq(0)) {
    fee = BigNumber((await estimateFees("")).toString());
  }
  return updateTransaction(transaction, { fee });
};
