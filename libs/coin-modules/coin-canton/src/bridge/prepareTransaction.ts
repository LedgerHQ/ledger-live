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
  const amount = transaction.amount || BigNumber(0);
  fee = BigNumber((await estimateFees(account.currency, BigInt(amount.toString()))).toString());
  return updateTransaction(transaction, { fee });
};
