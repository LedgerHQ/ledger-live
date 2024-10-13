import { AccountBridge } from "@ledgerhq/types-live";
import { KaspaAccount, KaspaTransactionCommon } from "../types/bridge";
import { getFeeEstimate } from "../network";

/**
 * Calculate fees for the current transaction
 * @param {AlgorandAccount} account
 * @param {Transaction} transaction
 */
export const prepareTransaction: AccountBridge<
  KaspaTransactionCommon,
  KaspaAccount
>["prepareTransaction"] = async (account, transaction) => {

  const fees = getFeeEstimate()
  // transaction.feeStrategy in here
  transaction.fees = 0.00002035

  // fetch utxos here as well ?

  return transaction;
};

export default prepareTransaction;
