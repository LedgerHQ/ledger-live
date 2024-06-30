import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import estimateMaxSpendable from "./estimateMaxSpendable";
import getEstimatedFees from "./getFeesForTransaction";
import { MinaAccount, Transaction } from "./types";

export const prepareTransaction: AccountBridge<
  Transaction,
  MinaAccount
>["prepareTransaction"] = async (a: Account, t: Transaction) => {
  const fees = await getEstimatedFees(t, a.freshAddress);

  const amount = t.useAllAmount
    ? await estimateMaxSpendable({
        account: a,
        transaction: t,
      })
    : t.amount;

  return defaultUpdateTransaction(t, { fees, amount });
};
