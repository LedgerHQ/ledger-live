import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction, ZcashAccount } from "../types/bridge";
import { collectIronwoodSpendableNotes, collectSpendableNotes } from "./operations";
import {
  estimateMaxSpendableAmount,
  estimateMaxSpendableTransparent,
} from "../logic/coin-selection";
import { isTransparentInputTransfer, resolveTransparentUtxos } from "./statusHelpers";

export const estimateMaxSpendable: AccountBridge<
  Transaction,
  ZcashAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount) as ZcashAccount;
  const tx = transaction;

  if (tx && isTransparentInputTransfer(tx.transferType)) {
    const utxoValues = resolveTransparentUtxos(mainAccount, tx).map(utxo => utxo.value);
    return estimateMaxSpendableTransparent(utxoValues, tx.transferType);
  }

  const transferType = tx?.transferType ?? "transparent";
  // Max spendable from note-based pools (Orchard or Ironwood).
  if (
    transferType !== "shielded" &&
    transferType !== "shielded-to-transparent" &&
    transferType !== "ironwood" &&
    transferType !== "ironwood-to-transparent"
  ) {
    const utxoValues = (mainAccount.bitcoinResources?.utxos ?? []).map(utxo => utxo.value);
    return estimateMaxSpendableTransparent(utxoValues, "transparent");
  }

  const transactions = mainAccount.privateInfo?.transactions ?? [];
  const notes =
    transferType === "ironwood" || transferType === "ironwood-to-transparent"
      ? collectIronwoodSpendableNotes(transactions)
      : collectSpendableNotes(transactions);
  return estimateMaxSpendableAmount(notes, transferType);
};
