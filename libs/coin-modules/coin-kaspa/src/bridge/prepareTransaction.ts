import BigNumber from "bignumber.js";
import { getFeeEstimate } from "../network";
import { ApiResponseFeeEstimate, KaspaAccount, Transaction } from "../types";

/**
 * Prepares a transaction by calculating and setting its fee based on the specified fee strategy.
 *
 * @param {KaspaAccount} _account - The account for which the transaction is being prepared.
 * @param {Transaction} transaction - The transaction object that needs to be prepared.
 *
 * @returns {Promise<Transaction>} The prepared transaction with the appropriate fees set.
 *
 * @throws Will throw an error if the fee strategy type is unknown.
 */
export const prepareTransaction = async (_account: KaspaAccount, transaction: Transaction) => {
  const fees: ApiResponseFeeEstimate = await getFeeEstimate();

  transaction.networkInfo = [
    {
      label: "slow",
      amount: BigNumber(fees.lowBuckets[0]?.feerate || 1),
      estimatedSeconds: fees.lowBuckets[0]?.estimatedSeconds,
    },
    {
      label: "medium",
      amount: BigNumber(fees.normalBuckets[0]?.feerate || 1),
      estimatedSeconds: fees.normalBuckets[0]?.estimatedSeconds,
    },
    {
      label: "fast",
      amount: BigNumber(fees.priorityBucket.feerate),
      estimatedSeconds: fees.priorityBucket.estimatedSeconds,
    },
  ];

  if (
    transaction.networkInfo.every(
      info => info.estimatedSeconds === transaction.networkInfo[0].estimatedSeconds,
    ) &&
    transaction.feesStrategy !== "custom"
  ) {
    transaction.feesStrategy = "fast";
  }

  return transaction;
};

export default prepareTransaction;
