import pick from "lodash/pick";
import type { SuiAccount, Transaction } from "../types";
import { craftTransaction, type CreateExtrinsicArg } from "../logic";

export const extractExtrinsicArg = (transaction: Transaction): CreateExtrinsicArg =>
  pick(transaction, ["mode", "amount", "recipient", "useAllAmount"]);

/**
 * @param {Account} account
 * @param {Transaction} transaction
 */
export const buildTransaction = async (account: SuiAccount, transaction: Transaction) => {
  return craftTransaction(account.freshAddress, extractExtrinsicArg(transaction));
};
