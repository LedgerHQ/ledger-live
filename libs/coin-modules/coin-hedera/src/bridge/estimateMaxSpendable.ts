import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { isTokenAccount } from "@ledgerhq/coin-framework/account/helpers";
import type { Transaction } from "../types";
import { getEstimatedFees } from "./utils";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const isTokenTransaction = isTokenAccount(account);
  const balance = account.balance;

  if (isTokenTransaction) {
    return Promise.resolve(balance);
  }

  const estimatedFees = await getEstimatedFees(mainAccount, "CryptoTransfer");
  let maxSpendable = balance.minus(estimatedFees);

  // set max spendable to 0 if negative
  // for cases where the user's account balance is smaller than the estimated fee
  if (maxSpendable.isLessThan(0)) {
    maxSpendable = new BigNumber(0);
  }

  return Promise.resolve(maxSpendable);
};
