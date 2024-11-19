import { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { NearAccount, Transaction } from "./types";
import { createTransaction } from "./createTransaction";
import getEstimatedFees from "./getFeesForTransaction";
import { getMaxAmount } from "./logic";

export const estimateMaxSpendable: AccountBridge<
  Transaction,
  NearAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);

  const draftTransaction = {
    ...createTransaction(account),
    ...transaction,
    amount: mainAccount.spendableBalance,
  };
  const fees = await getEstimatedFees(draftTransaction);
  const maxSpendable = getMaxAmount(mainAccount, draftTransaction, fees);

  if (maxSpendable.lt(0)) {
    return new BigNumber(0);
  }

  return maxSpendable;
};

export default estimateMaxSpendable;
