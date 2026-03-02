import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction } from "../types";
import { getEstimatedFees } from "./bridgeHelpers/fee";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  let balance = mainAccount.spendableBalance;

  if (balance.eq(0)) return balance;

  const estimatedFees = transaction?.fees ?? getEstimatedFees();

  if (balance.lte(estimatedFees)) return new BigNumber(0);

  balance = balance.minus(estimatedFees);

  // log("debug", "[estimateMaxSpendable] finish fn");

  return balance;
};
