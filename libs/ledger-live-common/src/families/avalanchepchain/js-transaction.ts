import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "./types";

const createTransaction = (): Transaction => ({
  family: "avalanchepchain",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: null,
  mode: "delegate",
  startTime: null,
  endTime: null,
  maxEndTime: null,
});

const prepareTransaction = async (
  account: Account,
  transaction: Transaction
) => {
  transaction.amount = transaction.useAllAmount
    ? account.spendableBalance
    : transaction.amount;

  return transaction;
};

const updateTransaction = (t, patch) => ({ ...t, ...patch });

export { createTransaction, prepareTransaction, updateTransaction };
