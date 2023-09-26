import BigNumber from "bignumber.js";
import { calculateMaxFeesToken } from "../utils/transaction-utils";
import type { Transaction } from "../types";
import { AccountLike } from "@ledgerhq/types-live";

export const estimateMaxSpendable = async (inputs: {
  account: AccountLike;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const { account, transaction } = inputs;

  if (account.type === "Account") {
    return account.balance;
  }
  if (transaction) {
    const maxTokenFees = await calculateMaxFeesToken(transaction);
    const spendable = account.balance.minus(maxTokenFees);
    if (spendable.gt(0)) return account.balance.minus(maxTokenFees);
    return new BigNumber(0);
  } else {
    return account.balance;
  }
};
