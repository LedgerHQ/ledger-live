import { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { SuiAccount, Transaction } from "../types";
import getEstimatedFees from "./getFeesForTransaction";

/**
 * Calculate fees for the current transaction
 * @function prepareTransaction
 * @description Prepares a transaction by calculating the amount, fees, and validating the recipient address.
 * @param {SuiAccount} account - The account from which the transaction is being prepared.
 * @param {Transaction} transaction - The transaction object containing details such as amount, fees, and recipient.
 * @returns {Promise<Transaction>} A promise that resolves to the updated transaction object.
 */
export const prepareTransaction: AccountBridge<
  Transaction,
  SuiAccount
>["prepareTransaction"] = async (account, transaction) => {
  const fees = await getEstimatedFees({
    account,
    transaction,
  });

  const patch: Partial<Transaction> = {
    fees,
  };

  return updateTransaction(transaction, patch);
};

export default prepareTransaction;
