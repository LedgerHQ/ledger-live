import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import { createTransaction } from "./createTransaction";
import getTransactionStatus from "./getTransactionStatus";
import { getCosmosDummyRecipient } from "./logic";
import { prepareTransaction } from "./prepareTransaction";
import type { CosmosAccount, Transaction } from "./types";

export const estimateMaxSpendable: AccountBridge<
  Transaction,
  CosmosAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);

  const t = await prepareTransaction(mainAccount, {
    ...createTransaction(account),
    ...transaction,
    recipient: transaction?.recipient || getCosmosDummyRecipient(mainAccount.currency.id),
    useAllAmount: true,
  });

  const { amount } = await getTransactionStatus(mainAccount, t);
  return amount;
};

export default estimateMaxSpendable;
