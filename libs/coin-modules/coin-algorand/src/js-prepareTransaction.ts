import isEqual from "lodash/isEqual";
import { BigNumber } from "bignumber.js";
import { estimateMaxSpendable } from "./js-estimateMaxSpendable";
import { getEstimatedFees } from "./js-getFeesForTransaction";
import type { AlgorandAccount, Transaction } from "./types";

/**
 * Calculate fees for the current transaction
 * @param {PolkadotAccount} a
 * @param {Transaction} t
 */
const prepareTransaction = async (
  account: AlgorandAccount,
  transaction: Transaction,
): Promise<Transaction> => {
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
