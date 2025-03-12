import { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { InvalidAddressBecauseDestinationIsAlsoSource, RecipientRequired } from "@ledgerhq/errors";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import type { SuiAccount, Transaction } from "../types";
import getEstimatedFees from "./getFeesForTransaction";

/**
 * Calculate fees for the current transaction
 * @function prepareTransaction
 * @description Prepares a transaction by calculating the amount, fees, and validating the recipient address.
 * @param {SuiAccount} account - The account from which the transaction is being prepared.
 * @param {Transaction} transaction - The transaction object containing details such as amount, fees, and recipient.
 * @returns {Promise<Transaction>} A promise that resolves to the updated transaction object.
 * @throws {RecipientRequired} If the recipient address is not provided.
 * @throws {InvalidAddressBecauseDestinationIsAlsoSource} If the recipient address is the same as the account's fresh address.
 */
export const prepareTransaction: AccountBridge<
  Transaction,
  SuiAccount
>["prepareTransaction"] = async (account, transaction) => {
  let amount = transaction.amount;
  if (transaction.useAllAmount) {
    const spendable = await estimateMaxSpendable({ account, transaction });
    amount = spendable;
  }

  let fees = transaction.fees;
  fees = await getEstimatedFees({
    account,
    transaction,
  });

  const errors: Record<string, Error> = {};
  if (!transaction.recipient) {
    errors.recipient = new RecipientRequired();
  } else if (account.freshAddress === transaction.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  } // TODO: add check for same valid sui address

  const patch: Partial<Transaction> = {
    amount,
    fees,
    errors,
  };

  return updateTransaction(transaction, patch);
};

export default prepareTransaction;
