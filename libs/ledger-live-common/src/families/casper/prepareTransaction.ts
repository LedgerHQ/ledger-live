import { AccountBridge } from "@ledgerhq/types-live";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getEstimatedFees } from "./bridge/bridgeHelpers/fee";
import { Transaction } from "./types";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
): Promise<Transaction> => {
  // log("debug", "[prepareTransaction] start fn");
  const fees = getEstimatedFees();

  const amount = transaction.useAllAmount
    ? account.spendableBalance.minus(transaction.fees)
    : transaction.amount;

  // log("debug", "[prepareTransaction] finish fn");
  return defaultUpdateTransaction(transaction, { fees, amount });
};
