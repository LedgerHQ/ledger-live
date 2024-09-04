import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import type { AccountBridge } from "@ledgerhq/types-live";
import { createTransaction } from "./createTransaction";
import getTransactionStatus from "./getTransactionStatus";
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
    recipient: transaction?.recipient || getAbandonSeedAddress(mainAccount.currency.id),
    useAllAmount: true,
  });

  const { amount } = await getTransactionStatus(mainAccount, t);
  return amount;
};

export default estimateMaxSpendable;
