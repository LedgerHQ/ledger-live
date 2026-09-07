import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction, ZcashAccount } from "../types/bridge";
import {
  estimateMaxSpendableAmount,
  estimateMaxSpendableTransparent,
} from "../logic/coin-selection";
import {
  boundTransparentUtxos,
  isTransparentInputTransfer,
  resolveTransparentUtxos,
} from "./statusHelpers";
import { getReservedNullifiers } from "./note-reservation";
import { collectSelectableIronwoodNotes } from "../logic/account/spendability";

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
  // Max spendable from the Ironwood note pool for shielded-input flows.
  if (transferType !== "shielded" && transferType !== "shielded-to-transparent") {
    // No transaction to resolve a caller override through -- bound the
    // account-synced set directly so this path can never disagree with
    // resolveTransparentUtxos's bound above.
    const utxoValues = boundTransparentUtxos(mainAccount.bitcoinResources?.utxos ?? []).map(
      utxo => utxo.value,
    );
    return estimateMaxSpendableTransparent(utxoValues, "transparent");
  }

  const notes = collectSelectableIronwoodNotes(mainAccount, getReservedNullifiers(mainAccount));
  return estimateMaxSpendableAmount(notes, transferType);
};
