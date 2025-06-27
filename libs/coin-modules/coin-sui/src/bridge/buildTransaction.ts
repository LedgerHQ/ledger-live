import pick from "lodash/pick";
import type { SuiAccount, Transaction } from "../types";
import { craftTransaction, type CreateExtrinsicArg } from "../logic";

export const extractExtrinsicArg = (transaction: Transaction): CreateExtrinsicArg =>
  pick(transaction, ["mode", "amount", "recipient", "useAllAmount", "stakedSuiId", "fees"]);

/**
 * @param {Account} account
 * @param {Transaction} transaction
 */
export const buildTransaction = async (
  { freshAddress }: SuiAccount,
  { recipient, mode, amount, useAllAmount = false, stakedSuiId = "" }: Transaction,
) => {
  return craftTransaction({
    sender: freshAddress,
    recipient,
    type: mode,
    amount: BigInt(amount.toString()),
    asset: { type: "native" },
    useAllAmount,
    stakedSuiId,
  });
};
