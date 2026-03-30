import { updateTransaction } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { AccountBridge } from "@ledgerhq/types-live";
import estimateMaxSpendable from "./estimateMaxSpendable";
import getEstimatedFees from "./getFeesForTransaction";
import type { NearAccount, Transaction } from "./types";

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
