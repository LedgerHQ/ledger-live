import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { Transaction } from "../types";
import { getEstimatedFees } from "./utils";
import { getHederaOperationType } from "../logic";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const balance = account.balance;
  const mainAccount = getMainAccount(account, parentAccount);
  const operationType = transaction ? getHederaOperationType(transaction) : "CryptoTransfer";
  const estimatedFees = await getEstimatedFees(mainAccount, operationType);

  let maxSpendable = balance.minus(estimatedFees);

  // set max spendable to 0 if negative
  // for cases where the user's account balance is smaller than the estimated fee
  if (maxSpendable.isLessThan(0)) {
    maxSpendable = new BigNumber(0);
  }

  return Promise.resolve(maxSpendable);
};
