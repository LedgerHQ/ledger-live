import { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { InvalidAddressBecauseDestinationIsAlsoSource, RecipientRequired } from "@ledgerhq/errors";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import type { SuiAccount, Transaction } from "../types";
import getEstimatedFees from "./getFeesForTransaction";

/**
 * Calculate fees for the current transaction
 * @param {SuiAccount} account
 * @param {Transaction} transaction
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
