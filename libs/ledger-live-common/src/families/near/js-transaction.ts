import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
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

export const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  const fees = await getEstimatedFees(t);

  const amount = t.useAllAmount
    ? await estimateMaxSpendable({
        account: a,
        transaction: t,
        calculatedFees: fees,
      })
    : t.amount;

  return defaultUpdateTransaction(t, { fees, amount });
};
