import { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { SuiAccount, Transaction } from "../types";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import getFeesForTransaction from "./getFeesForTransaction";
import BigNumber from "bignumber.js";

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
  let amount = transaction.amount;
  const spendable = await estimateMaxSpendable({ account, transaction });
  if (transaction.useAllAmount || amount.gt(spendable)) {
    amount = spendable;
  }

  let fees: BigNumber;
  try {
    fees = await getFeesForTransaction({
      account,
      transaction,
    });
  } catch (e) {
    fees = BigNumber(0);
  }

  const patch: Partial<Transaction> = {
    amount,
    fees,
  };

  return updateTransaction(transaction, patch);
};

export default prepareTransaction;
