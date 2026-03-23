import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { createTransaction } from "./createTransaction";
import getEstimatedFees from "./getFeesForTransaction";
import { getMaxAmount } from "./logic";
import type { NearAccount, Transaction } from "./types";

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
