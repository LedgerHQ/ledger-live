import { BigNumber } from "bignumber.js";
import type { AlgorandAccount, Transaction } from "./types";
import { getEstimatedFees } from "./js-getFeesForTransaction";
import { estimateMaxSpendable } from "./js-estimateMaxSpendable";

export const createTransaction = (): Transaction => ({
  family: "algorand",
  amount: new BigNumber(0),
  fees: null,
  recipient: "",
  useAllAmount: false,
  memo: null,
  mode: "send",
  assetId: null,
});

export const prepareTransaction = async (
  account: AlgorandAccount,
  transaction: Transaction
): Promise<Transaction> => {
  let recipient: string;
  let amount: BigNumber;
  if (transaction.mode === "send") {
    recipient = transaction.recipient;
    amount = transaction.useAllAmount
      ? await estimateMaxSpendable({ account, transaction })
      : transaction.amount;
  } else if (
    transaction.mode === "optIn" ||
    transaction.mode === "claimReward"
  ) {
    recipient = account.freshAddress;
    amount = new BigNumber(0);
  } else {
    throw new Error(`Unsupported transaction mode '${transaction.mode}'`);
  }

  const fees = await getEstimatedFees(account, transaction);

  return { ...transaction, fees, amount, recipient };
};
