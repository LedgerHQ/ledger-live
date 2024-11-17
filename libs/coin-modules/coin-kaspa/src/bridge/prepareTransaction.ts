import { KaspaAccount, KaspaTransaction } from "../types/bridge";
import { getFeeEstimate } from "../network";
import { FeeEstimateResponse } from "../network/indexer-api/getFeeEstimate";

/**
 * Prepares a transaction by calculating and setting its fee based on the specified fee strategy.
 *
 * @param {KaspaAccount} account - The account for which the transaction is being prepared.
 * @param {KaspaTransaction} transaction - The transaction object that needs to be prepared.
 *
 * @returns {Promise<Transaction>} The prepared transaction with the appropriate fees set.
 *
 * @throws Will throw an error if the fee strategy type is unknown.
 */
export const prepareTransaction = async (account: KaspaAccount, transaction: KaspaTransaction) => {
  const fees: FeeEstimateResponse = await getFeeEstimate();

  switch (transaction.feesStrategy) {
    case "slow":
      transaction.feerate = fees.lowBuckets[0].feerate;
      break;

    case "medium":
      transaction.feerate = fees.normalBuckets[0].feerate;
      break;
    case "fast":
      transaction.feerate = fees.priorityBucket.feerate;
      break;
    case "custom":
      // transaction.fees = transaction.fees; // nothing to do here?
      break;

    default:
      throw new Error("Unknown fee strategy type for transaction.");
      break;
  }

  return transaction;
};

export default prepareTransaction;
