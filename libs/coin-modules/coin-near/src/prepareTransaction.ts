import type { AccountBridge } from "@ledgerhq/types-live";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { NearAccount, Transaction } from "./types";
import getEstimatedFees from "./getFeesForTransaction";
import estimateMaxSpendable from "./estimateMaxSpendable";

export const prepareTransaction: AccountBridge<
  Transaction,
  NearAccount
>["prepareTransaction"] = async (account, transaction) => {
  const amount = transaction.useAllAmount
    ? await estimateMaxSpendable({
        account,
        transaction,
      })
    : transaction.amount;

  const fees = await getEstimatedFees(transaction);
  return updateTransaction(transaction, { fees, amount });
};
