import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { calculateGasFees } from "./utils/transaction-utils";
import type { Transaction } from "./types";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  transaction,
}): Promise<BigNumber> => {
  if (account.type === "Account" || !transaction) {
    return account.balance;
  }

  const { estimatedGasFees: maxTokenFees } = await calculateGasFees(transaction, true);
  const spendable = account.balance.minus(maxTokenFees);
  if (spendable.gt(0)) return account.balance.minus(maxTokenFees);
  return new BigNumber(0);
};
