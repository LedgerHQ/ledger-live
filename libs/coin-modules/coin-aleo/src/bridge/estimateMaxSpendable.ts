import type { AccountBridge } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import type { AleoAccount, Transaction as AleoTransaction } from "../types";
import { createTransaction } from "./createTransaction";
import { prepareTransaction } from "./prepareTransaction";

export const estimateMaxSpendable: AccountBridge<
  AleoTransaction,
  AleoAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = transaction ?? createTransaction(mainAccount);

  const preparedTransaction = await prepareTransaction(mainAccount, {
    ...t,
    useAllAmount: true,
    ...(account.type === "TokenAccount" && { subAccountId: account.id }),
  });

  return preparedTransaction.amount;
};
