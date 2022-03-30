import BigNumber from "bignumber.js";
import { findSubAccountById } from "../../account";
import type { Account, TokenAccount } from "../../types";
import type { Transaction } from "./types";

export const getAmountValue = (
  account: Account,
  transaction: Transaction,
  fees: BigNumber
): BigNumber => {
  // Asset
  if (transaction.subAccountId) {
    const asset = findSubAccountById(
      account,
      transaction.subAccountId
    ) as TokenAccount;
    return transaction.useAllAmount
      ? new BigNumber(asset.spendableBalance)
      : transaction.amount;
  }

  // Native
  return transaction.useAllAmount && transaction.networkInfo
    ? BigNumber.max(account.spendableBalance.minus(fees), 0)
    : transaction.amount;
};
