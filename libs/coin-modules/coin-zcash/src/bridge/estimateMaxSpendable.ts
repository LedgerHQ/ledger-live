import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { ZcashContext } from "../config";
import type { Transaction, ZcashAccount } from "../types/bridge";
import {
  estimateMaxSpendableAmount,
  estimateMaxSpendableTransparent,
  marginalFeeFor,
} from "../logic/coin-selection";
import {
  boundTransparentUtxos,
  isTransparentInputTransfer,
  resolveTransparentUtxos,
} from "./statusHelpers";
import { getReservedNullifiers } from "./note-reservation";
import { collectSelectableIronwoodNotes } from "../logic/account/spendability";

export const buildEstimateMaxSpendable =
  (context: ZcashContext): AccountBridge<Transaction, ZcashAccount>["estimateMaxSpendable"] =>
  async ({ account, parentAccount, transaction }) => {
    const mainAccount = getMainAccount(account, parentAccount) as ZcashAccount;
    const tx = transaction;
    const { zip2009 } = await context.config(mainAccount.currency.id);
    const marginalFee = marginalFeeFor(mainAccount, zip2009);

    if (tx && isTransparentInputTransfer(tx.transferType)) {
      const utxoValues = resolveTransparentUtxos(mainAccount, tx).map(utxo => utxo.value);
      return estimateMaxSpendableTransparent(utxoValues, tx.transferType, marginalFee);
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
      return estimateMaxSpendableTransparent(utxoValues, "transparent", marginalFee);
    }

    const notes = collectSelectableIronwoodNotes(mainAccount, getReservedNullifiers(mainAccount));
    return estimateMaxSpendableAmount(notes, transferType, marginalFee);
  };
