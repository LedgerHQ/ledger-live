import { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { Transaction } from "../types";
import { getEstimatedFees } from "./bridgeHelpers/fee";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  transaction,
}) => {
  const balance = account.balance;

  let maxSpendable = balance.minus(transaction?.fees ?? getEstimatedFees());

  if (maxSpendable.isLessThan(0)) {
    maxSpendable = new BigNumber(0);
  }

  return maxSpendable;
};
