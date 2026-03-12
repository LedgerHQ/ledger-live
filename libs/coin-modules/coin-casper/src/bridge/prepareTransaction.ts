import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { getEstimatedFees } from "./bridgeHelpers/fee";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
): Promise<Transaction> => {
  // log("debug", "[prepareTransaction] start fn");
  const fees = getEstimatedFees();

  const amount = transaction.useAllAmount
    ? account.spendableBalance.minus(fees)
    : transaction.amount;

  // log("debug", "[prepareTransaction] finish fn");
  return updateTransaction(transaction, { fees, amount });
};
