import { REPLACE_CANCEL, REPLACE_SPEEDUP } from "@ledgerhq/coin-bitcoin/api";
import type { UtxoAccountOptions } from "@ledgerhq/account-module-utxo";
import { getFamilySpecificData, getUtxoStrategy, type Transaction } from "../types";

/** A replacement speeds up, or cancels when it pays the account back. */
export function computeIntentType(transaction: Record<string, unknown>): string {
  const data = getFamilySpecificData(transaction as Transaction);
  if (!data.replaceTxId) return "send";
  return data.changeAddress && (transaction as Transaction).recipient === data.changeAddress
    ? REPLACE_CANCEL
    : REPLACE_SPEEDUP;
}

/** The coin control and the replacement the user chose, for the account module. */
export function accountOptions(transaction: Record<string, unknown>): UtxoAccountOptions {
  const { strategy, excludeUTXOs } = getUtxoStrategy(transaction as Transaction);
  const { replaceTxId } = getFamilySpecificData(transaction as Transaction);
  return {
    strategy,
    excludedUtxos: excludeUTXOs.map(({ hash, outputIndex }) => ({ txid: hash, vout: outputIndex })),
    ...(replaceTxId ? { replaceTxId } : {}),
  };
}
