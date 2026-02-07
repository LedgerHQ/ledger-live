import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import type { AleoAccount, Transaction as AleoTransaction } from "../types";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";

// FIXME: with private balance, max spendable is value of record that has the biggest amount
export const estimateMaxSpendable: AccountBridge<
  AleoTransaction,
  AleoAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = transaction ?? createTransaction(mainAccount);

  const preparedTransaction = await prepareTransaction(mainAccount, {
    ...t,
    useAllAmount: true,
  });

  const maxSpendable = mainAccount.balance.minus(preparedTransaction.fees);

  return BigNumber.max(0, maxSpendable);
};
