import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { calcMaxSpendableAmount, getFeeRate } from "../logic";
import { KaspaAccount, Transaction } from "../types";
import { getCachedUtxos } from "./getTransactionStatus";

export const estimateMaxSpendable: AccountBridge<
  Transaction,
  KaspaAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount) as KaspaAccount;

  if (!mainAccount?.xpub) {
    return BigNumber(0);
  }

  // Bounded by MAX_UTXOS_PER_TX inputs, consistent with selectUtxos/getTransactionStatus.
  const { utxos } = await getCachedUtxos(mainAccount);
  const isEcdsaRecipient = !!transaction?.recipient && transaction.recipient.length > 67;
  const feeRate = getFeeRate(transaction).toNumber() || 1;

  return calcMaxSpendableAmount(utxos, isEcdsaRecipient, feeRate);
};
