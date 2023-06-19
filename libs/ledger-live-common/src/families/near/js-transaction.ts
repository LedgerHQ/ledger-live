import { $Shape } from "utility-types";
import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import getEstimatedFees from "./js-getFeesForTransaction";
import estimateMaxSpendable from "./js-estimateMaxSpendable";

export const createTransaction = (): Transaction => ({
  family: "near",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: new BigNumber(0),
});

export const updateTransaction = (t: Transaction, patch: $Shape<Transaction>): Transaction => ({
  ...t,
  ...patch,
});

export const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  const fees = await getEstimatedFees(t);

  const amount = t.useAllAmount
    ? await estimateMaxSpendable({
        account: a,
        transaction: t,
        calculatedFees: fees,
      })
    : t.amount;

  return { ...t, fees, amount };
};
