import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import estimateMaxSpendable from "./estimateMaxSpendable";
import getEstimatedFees from "./getFeesForTransaction";
import { MinaAccount, Transaction } from "../types/common";
import { getNonce } from "../api";

export const prepareTransaction: AccountBridge<
  Transaction,
  MinaAccount
>["prepareTransaction"] = async (a: Account, t: Transaction) => {
  const { fee, accountCreationFee } = await getEstimatedFees(t, a.freshAddress);

  const amount = t.useAllAmount
    ? await estimateMaxSpendable({
        account: a,
        transaction: t,
      })
    : t.amount;

  // if (accountCreationFee.gt(0) && amount.lt(accountCreationFee)) {
  //   amount = accountCreationFee;
  // }

  const nonce = await getNonce(t, a.freshAddress);

  return updateTransaction(t, { fees: { fee, accountCreationFee }, amount, nonce });
};
