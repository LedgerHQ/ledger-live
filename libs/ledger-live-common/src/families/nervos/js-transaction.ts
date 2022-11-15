import { BigNumber } from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { $Shape } from "utility-types";
import type { Transaction } from "./types";

export const createTransaction = (): Transaction => {
  return {
    family: "nervos",
    mode: "SendCKB",
    amount: new BigNumber(0),
    recipient: "",
    feePerByte: new BigNumber(1),
    useAllAmount: false,
  };
};

export const updateTransaction = (
  t: Transaction,
  patch: $Shape<Transaction>
): Transaction => ({
  ...t,
  ...patch,
});

export const prepareTransaction = async (
  a: Account,
  t: Transaction
): Promise<Transaction> => t;
