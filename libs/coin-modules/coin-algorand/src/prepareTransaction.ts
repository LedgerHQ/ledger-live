import { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import isEqual from "lodash/isEqual";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getEstimatedFees } from "./getFeesForTransaction";
import type { AlgorandAccount, Transaction } from "./types";

/**
 * Calculate fees for the current transaction
 * @param {AlgorandAccount} account
 * @param {Transaction} transaction
 */
export const prepareTransaction: AccountBridge<
  Transaction,
  AlgorandAccount
>["prepareTransaction"] = async (account, transaction) => {
  let recipient: string;
  let amount: BigNumber;
  if (transaction.mode === "send") {
    recipient = transaction.recipient;
    amount = transaction.useAllAmount
      ? await estimateMaxSpendable({ account, transaction })
      : transaction.amount;
  } else if (transaction.mode === "optIn" || transaction.mode === "claimReward") {
    recipient = account.freshAddress;
    amount = new BigNumber(0);
  } else {
    throw new Error(`Unsupported transaction mode '${transaction.mode}'`);
  }

  const fees = await getEstimatedFees(account, transaction);

  const newTx = { ...transaction, fees, amount, recipient };
  return isEqual(transaction, newTx) ? transaction : newTx;
};

export default prepareTransaction;
