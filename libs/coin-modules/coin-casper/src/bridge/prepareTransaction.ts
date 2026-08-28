import { updateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "../types";
import { getEstimatedFees } from "../logic/estimateFees";

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
): Promise<Transaction> => {
  // log("debug", "[prepareTransaction] start fn");
  const fees = getEstimatedFees();

  const amount = transaction.useAllAmount
    ? account.spendableBalance.minus(fees)
    : transaction.amount;

  // Back-compat: legacy callers may set only `transferId`; normalize to memoValue/memoType here.
  const memoValue = transaction.memoValue ?? transaction.transferId ?? null;
  const memoType = transaction.memoType ?? (memoValue !== null ? "transferId" : null);

  // log("debug", "[prepareTransaction] finish fn");
  return updateTransaction(transaction, { fees, amount, memoValue, memoType });
};
