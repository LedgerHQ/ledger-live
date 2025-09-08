import BigNumber from "bignumber.js";
import type { Transaction, TransactionRaw } from "../../types";

export const getMockedTransaction = (overrides?: Partial<Transaction>): Transaction => {
  return {
    family: "hedera",
    amount: new BigNumber(0),
    recipient: "",
    mode: "send",
    useAllAmount: false,
    ...overrides,
  } as Transaction;
};

export const getMockedTransactionRaw = (overrides?: Partial<TransactionRaw>): TransactionRaw => {
  return {
    family: "hedera",
    amount: "0",
    recipient: "",
    mode: "send",
    useAllAmount: false,
    ...overrides,
  } as TransactionRaw;
};
