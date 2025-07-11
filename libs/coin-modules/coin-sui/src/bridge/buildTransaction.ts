import pick from "lodash/pick";
import type { SuiAccount, Transaction } from "../types";
import { craftTransaction, type CreateExtrinsicArg } from "../logic";

export const extractExtrinsicArg = (transaction: Transaction): CreateExtrinsicArg =>
  pick(transaction, ["mode", "amount", "recipient", "useAllAmount", "coinType"]);

/**
 * @param {Account} account
 * @param {Transaction} transaction
 */
export const buildTransaction = async (
  { freshAddress }: SuiAccount,
  { recipient, mode, amount, coinType }: Transaction,
) => {
  return craftTransaction({
    sender: freshAddress,
    recipient,
    type: mode,
    coinType,
    amount: BigInt(amount.toString()),
    asset: { type: "native" },
  });
};
