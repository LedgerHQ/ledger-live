import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import { calcMaxSpendableAmount, getFeeRate } from "../logic";
import { KaspaAccount, Transaction } from "../types";
import { getCachedUtxos } from "./getTransactionStatus";

export const estimateMaxSpendable: AccountBridge<
  Transaction,
  KaspaAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);

  const { utxos } = await getCachedUtxos(mainAccount).catch(() => ({ utxos: [] }));
  const isEcdsaRecipient = transaction?.recipient ? transaction.recipient.length > 67 : true;
  const feeRate = getFeeRate(transaction).toNumber() || 1;

  return calcMaxSpendableAmount(utxos, isEcdsaRecipient, feeRate);
};
