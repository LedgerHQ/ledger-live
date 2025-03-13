import type { SuiAccount, Transaction } from "../types";
import { craftTransaction, type CreateExtrinsicArg } from "../logic";

export const extractExtrinsicArg = (
  _account: SuiAccount,
  transaction: Transaction,
): CreateExtrinsicArg => ({
  mode: transaction.mode,
  amount: transaction.amount,
  recipient: transaction.recipient,
  useAllAmount: transaction.useAllAmount,
});

/**
 *
 * @param {Account} account
 * @param {Transaction} transaction
 */
export const buildTransaction = async (account: SuiAccount, transaction: Transaction) => {
  return craftTransaction(account.freshAddress, extractExtrinsicArg(account, transaction));
};
