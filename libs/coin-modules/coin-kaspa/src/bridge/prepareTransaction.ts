import { AccountBridge } from "@ledgerhq/types-live";
import { KaspaAccount, KaspaTransactionCommon } from "../types/bridge";
import { getFeeEstimate } from "../network";
import { FeeEstimateResponse } from "../network/indexer-api/getFeeEstimate";


/**
 * Prepares a transaction by calculating and setting its fee based on the specified fee strategy.
 *
 * @param {KaspaAccount} account - The account for which the transaction is being prepared.
 * @param {KaspaTransactionCommon} transaction - The transaction object that needs to be prepared.
 *
 * @returns {Promise<KaspaTransactionCommon>} The prepared transaction with the appropriate fees set.
 *
 * @throws Will throw an error if the fee strategy type is unknown.
 */
export const prepareTransaction: AccountBridge<
  KaspaTransactionCommon,
  KaspaAccount
>["prepareTransaction"] = async (account, transaction) => {
  const fees: FeeEstimateResponse = await getFeeEstimate();

  // transaction.feeStrategy in here
  const tx_mass: int = 2035;
  switch (transaction.feesStrategy) {
    case "slow":
      transaction.fees = fees.lowBuckets[0].feerate * tx_mass;
      break;

    case "medium":
      transaction.fees = fees.normalBuckets[0].feerate * tx_mass;
      break;
    case "fast":
      transaction.fees = fees.priorityBucket.feerate * tx_mass;
      break;
    case "custom":
      // transaction.fees = transaction.fees; // nothing to do here?
      break;
    default:
      throw new Error("Unknown fee strategy type for transaction.");
      break;
  }

  // fetch utxos here as well ?

  return transaction;
};

export default prepareTransaction;
