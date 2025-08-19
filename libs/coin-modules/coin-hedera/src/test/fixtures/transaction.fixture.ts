import BigNumber from "bignumber.js";
import type { Transaction, TransactionRaw } from "../../types";

export const getMockedTransaction = (overrides?: Partial<Transaction>): Transaction => {
  return {
    family: "hedera",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    ...overrides,
  };
};

export const getMockedTransactionRaw = (overrides?: Partial<TransactionRaw>): TransactionRaw => {
  return {
    family: "hedera",
    amount: "0",
    recipient: "",
    useAllAmount: false,
    ...overrides,
  };
};
