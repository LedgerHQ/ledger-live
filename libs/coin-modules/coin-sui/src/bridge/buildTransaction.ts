import type { SuiAccount, Transaction } from "../types";
import { craftTransaction, type CreateExtrinsicArg } from "../logic";
import { isFirstBond, getNonce } from "./utils";

export const extractExtrinsicArg = (
  account: SuiAccount,
  transaction: Transaction,
): CreateExtrinsicArg => ({
  mode: transaction.mode,
  amount: transaction.amount,
  recipient: transaction.recipient,
  isFirstBond: isFirstBond(account),
  useAllAmount: transaction.useAllAmount,
});

/**
 *
 * @param {Account} account
 * @param {Transaction} transaction
 * @param {boolean} forceLatestParams - forces the use of latest transaction params
 */
export const buildTransaction = async (
  account: SuiAccount,
  transaction: Transaction,
  forceLatestParams = false,
) => {
  return craftTransaction(
    account.freshAddress,
    getNonce(account),
    extractExtrinsicArg(account, transaction),
    forceLatestParams,
  );
};
