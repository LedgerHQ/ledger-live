import type { BigNumber } from "bignumber.js";
import type { AccountBridge } from "@ledgerhq/types-live";
import type { Transaction, ZcashAccount, ZcashTransferType } from "../types/bridge";
import type { SpendableNote } from "../network/types";
import { collectIronwoodSpendableNotes, collectSpendableNotes } from "./operations";
import {
  estimateMaxSpendableAmount,
  estimateMaxSpendableTransparent,
  selectNotes,
  selectTransparentInputs,
} from "../logic/coin-selection";
import { isTransparentInputTransfer, resolveTransparentUtxos } from "./statusHelpers";

// Note-selection flows (Ironwood + Orchard-shielded). Ironwood spends Ironwood
// notes ("ironwood" / "ironwood-to-transparent"), shielded spends Orchard notes
// ("shielded" / "shielded-to-transparent").
const IRONWOOD_TRANSFER_TYPES = new Set<ZcashTransferType>(["ironwood", "ironwood-to-transparent"]);
const SHIELDED_TRANSFER_TYPES = new Set<ZcashTransferType>(["shielded", "shielded-to-transparent"]);

// Strip any stale fee/change from a prior prepare and reset the amount so the UI
// never shows a spendable amount without a matching fee.
function resetPreparedTransaction(tx: Transaction, amount: BigNumber): Transaction {
  const { zcashFee: _fee, changeAmount: _change, ...rest } = tx;
  return { ...rest, amount, selectedNotes: [] };
}

// Prepare a transparent-input flow (Public→*): ZIP-317 fee/change resolution over
// transparent UTXOs, with no Orchard note selection.
function prepareTransparentTransaction(account: ZcashAccount, tx: Transaction): Transaction {
  const utxoValues = resolveTransparentUtxos(account, tx).map(utxo => utxo.value);
  // When useAllAmount is set, the effective amount is the max spendable over the
  // current UTXO set — recomputed here so it stays coherent even if a prior
  // prepare mutated tx.amount and the UTXOs have since changed.
  const effectiveAmount = tx.useAllAmount
    ? estimateMaxSpendableTransparent(utxoValues, tx.transferType)
    : tx.amount;
  const result = selectTransparentInputs(
    utxoValues,
    effectiveAmount,
    !!tx.useAllAmount,
    tx.transferType,
  );
  if (!result) return resetPreparedTransaction(tx, effectiveAmount);
  return {
    ...tx,
    amount: effectiveAmount,
    selectedNotes: [], // transparent inputs — no shielded note spends
    zcashFee: result.fee,
    changeAmount: result.changeAmount,
  };
}

// Prepare a note-selection flow (Ironwood or Orchard-shielded). Both share the
// same pipeline; only the collected note set differs.
function prepareNoteTransaction(notes: SpendableNote[], tx: Transaction): Transaction {
  // When useAllAmount is set, compute the effective amount from max spendable.
  const effectiveAmount = tx.useAllAmount
    ? estimateMaxSpendableAmount(notes, tx.transferType)
    : tx.amount;
  if (effectiveAmount.lte(0)) return resetPreparedTransaction(tx, effectiveAmount);
  const result = selectNotes(notes, effectiveAmount, tx.transferType);
  if (!result) return resetPreparedTransaction(tx, effectiveAmount);
  return {
    ...tx,
    amount: effectiveAmount,
    selectedNotes: result.selectedNotes,
    zcashFee: result.fee,
    changeAmount: result.changeAmount,
  };
}

/**
 * Resolves fee + change (and, for shielded-input flows, the selected notes) for
 * the transaction's transfer type. Transparent-input flows (Public→*) spend
 * transparent UTXOs -- no note selection; note-selection flows spend Orchard
 * ("shielded", "shielded-to-transparent") or Ironwood ("ironwood",
 * "ironwood-to-transparent") notes.
 */
export const prepareTransaction: AccountBridge<
  Transaction,
  ZcashAccount
>["prepareTransaction"] = async (account, transaction) => {
  const tx = transaction;

  if (isTransparentInputTransfer(tx.transferType)) {
    return prepareTransparentTransaction(account, tx);
  }

  const transactions = account.privateInfo?.transactions ?? [];
  if (IRONWOOD_TRANSFER_TYPES.has(tx.transferType)) {
    return prepareNoteTransaction(collectIronwoodSpendableNotes(transactions), tx);
  }
  if (SHIELDED_TRANSFER_TYPES.has(tx.transferType)) {
    return prepareNoteTransaction(collectSpendableNotes(transactions), tx);
  }

  return tx;
};
