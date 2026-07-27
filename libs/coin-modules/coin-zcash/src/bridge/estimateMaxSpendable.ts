import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction, ZcashAccount } from "../types/bridge";
import { collectSpendableNotes } from "../logic/operations";
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
  if (transferType !== "shielded" && transferType !== "shielded-to-transparent") {
    const utxoValues = (mainAccount.bitcoinResources?.utxos ?? []).map(utxo => utxo.value);
    return estimateMaxSpendableTransparent(utxoValues, "transparent");
  }

  const notes = collectSpendableNotes(mainAccount.privateInfo?.transactions ?? []);
  return estimateMaxSpendableAmount(notes, transferType);
};
