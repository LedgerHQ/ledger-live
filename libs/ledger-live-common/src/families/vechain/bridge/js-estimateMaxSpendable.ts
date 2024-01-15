import BigNumber from "bignumber.js";
import { calculateGasFees } from "../utils/transaction-utils";
import type { Transaction } from "../types";
import { AccountLike } from "@ledgerhq/types-live";

export const estimateMaxSpendable = async (inputs: {
  account: AccountLike;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const { account, transaction } = inputs;

  if (account.type === "Account" || !transaction) {
    return account.balance;
  }

  const { estimatedGasFees: maxTokenFees } = await calculateGasFees(transaction, true);
  const spendable = account.balance.minus(maxTokenFees);
  if (spendable.gt(0)) return account.balance.minus(maxTokenFees);
  return new BigNumber(0);
};
