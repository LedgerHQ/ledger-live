import type { AccountBridge } from "@ledgerhq/types-live";
import { CeloAccount, Transaction } from "./types";
import getTransactionStatus from "./getTransactionStatus";
import prepareTransaction from "./prepareTransaction";
import createTransaction from "./createTransaction";
import { getMainAccount } from "../../account";

export const estimateMaxSpendable: AccountBridge<
  Transaction,
  CeloAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(account),
    ...transaction,
    useAllAmount: true,
  });
  const { amount } = await getTransactionStatus(mainAccount, t);
  return amount;
};

export default estimateMaxSpendable;
