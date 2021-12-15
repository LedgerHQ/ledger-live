import BigNumber from "bignumber.js";
import type { Account } from "../../../types";
import type { Transaction } from "../types";

export const getAmountValue = (
  account: Account,
  transaction: Transaction,
  fees: BigNumber
): BigNumber => {
  // Asset
  if (transaction.subAccountId) {
    return transaction.amount;
  }

  // Native
  return transaction.useAllAmount && transaction.networkInfo
    ? account.balance.minus(transaction.networkInfo.baseReserve).minus(fees)
    : transaction.amount.plus(fees);
};
