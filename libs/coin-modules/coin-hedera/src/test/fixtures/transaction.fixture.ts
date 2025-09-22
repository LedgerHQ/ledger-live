import BigNumber from "bignumber.js";
import type { Transaction, TransactionRaw } from "../../types";
import { HEDERA_TRANSACTION_MODES } from "../../constants";

export const getMockedTransaction = (overrides?: Partial<Transaction>): Transaction => {
  return {
    mode: HEDERA_TRANSACTION_MODES.Send,
    family: "hedera",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    ...overrides,
  } as Transaction;
};

export const getMockedTransactionRaw = (overrides?: Partial<TransactionRaw>): TransactionRaw => {
  return {
    mode: HEDERA_TRANSACTION_MODES.Send,
    family: "hedera",
    amount: "0",
    recipient: "",
    useAllAmount: false,
    ...overrides,
  } as TransactionRaw;
};
