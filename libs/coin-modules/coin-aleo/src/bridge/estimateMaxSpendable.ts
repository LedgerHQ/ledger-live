import BigNumber from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/coin-framework/account/helpers";
import type { AleoAccount, Transaction as AleoTransaction } from "../types";
import { prepareTransaction } from "./prepareTransaction";
import { createTransaction } from "./createTransaction";

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

  // TODO: max spendable for private transaction is the record with the biggest amount
  // TODO: if user clicks on "send max", records used for transaction must be updated

  const maxSpendable = mainAccount.balance.minus(preparedTransaction.fees);

  return BigNumber.max(0, maxSpendable);
};
