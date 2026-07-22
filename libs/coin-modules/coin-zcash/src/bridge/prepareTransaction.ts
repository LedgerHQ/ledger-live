import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction, ZcashAccount } from "../types/bridge";
import { collectSpendableNotes } from "../logic/operations";
import {
  estimateMaxSpendableAmount,
  estimateMaxSpendableTransparent,
  selectNotes,
  selectTransparentInputs,
} from "../logic/coin-selection";
import { isTransparentInputTransfer, resolveTransparentUtxos } from "./statusHelpers";

/**
 * Resolves fee + change (and, for shielded-input flows, the selected Orchard
 * notes) for the transaction's transfer type. Transparent-input flows
 * (Public→*) spend transparent UTXOs -- no note selection; shielded-input
 * flows ("shielded", "shielded-to-transparent") select Orchard notes.
 */
export const prepareTransaction: AccountBridge<Transaction, ZcashAccount>["prepareTransaction"] =
  async (account, transaction) => {
    const tx = transaction;

    if (isTransparentInputTransfer(tx.transferType)) {
      const utxoValues = resolveTransparentUtxos(account, tx).map(utxo => utxo.value);
      const effectiveAmount = tx.useAllAmount
        ? estimateMaxSpendableTransparent(utxoValues, tx.transferType)
        : tx.amount;
      const result = selectTransparentInputs(
        utxoValues,
        effectiveAmount,
        !!tx.useAllAmount,
        tx.transferType,
      );
      if (!result) {
        const { zcashFee: _fee, changeAmount: _change, ...rest } = tx;
        return { ...rest, amount: effectiveAmount, selectedNotes: [] };
      }
      return {
        ...tx,
        amount: effectiveAmount,
        selectedNotes: [],
        zcashFee: result.fee,
        changeAmount: result.changeAmount,
      };
    }

    if (tx.transferType !== "shielded" && tx.transferType !== "shielded-to-transparent") return tx;

    const notes = collectSpendableNotes(account.privateInfo?.transactions ?? []);
    const effectiveAmount = tx.useAllAmount
      ? estimateMaxSpendableAmount(notes, tx.transferType)
      : tx.amount;

    if (effectiveAmount.lte(0)) {
      const { zcashFee: _fee, changeAmount: _change, ...rest } = tx;
      return { ...rest, amount: effectiveAmount, selectedNotes: [] };
    }

    const result = selectNotes(notes, effectiveAmount, tx.transferType);
    if (!result) {
      const { zcashFee: _fee, changeAmount: _change, ...rest } = tx;
      return { ...rest, amount: effectiveAmount, selectedNotes: [] };
    }

    return {
      ...tx,
      amount: effectiveAmount,
      selectedNotes: result.selectedNotes,
      zcashFee: result.fee,
      changeAmount: result.changeAmount,
    };
  };
