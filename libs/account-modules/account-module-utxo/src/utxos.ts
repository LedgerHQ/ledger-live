import type { AccountOperation } from "@ledgerhq/account-module-framework";
import { removeReplaced } from "./replaced";
import type { UtxoState, UtxoTransaction } from "./types";

const keyOf = (txid: string, vout: number) => `${txid}:${vout}`;

function ownOutputs(tx: UtxoTransaction, own: ReadonlySet<string>): UtxoState[] {
  return tx.outputs.flatMap(output =>
    output.address && own.has(output.address)
      ? [
          {
            txid: tx.id,
            vout: output.index,
            value: output.value,
            address: output.address,
            height: tx.block?.height ?? null,
            replaceable: tx.replaceable,
          },
        ]
      : [],
  );
}

/**
 * Applies transactions to a UTXO set: every output first, then every spend. Within one batch an
 * input can come before the output it spends, and a transaction read again (sync rewind) must
 * neither resurrect nor duplicate an output.
 */
export function applyTransactions(
  utxos: UtxoState[],
  transactions: UtxoTransaction[],
  own: ReadonlySet<string>,
): UtxoState[] {
  const byOutpoint = new Map(utxos.map(u => [keyOf(u.txid, u.vout), u]));
  for (const tx of transactions) {
    for (const utxo of ownOutputs(tx, own)) byOutpoint.set(keyOf(utxo.txid, utxo.vout), utxo);
  }
  for (const tx of transactions) {
    for (const input of tx.inputs) {
      if (input.txid) byOutpoint.delete(keyOf(input.txid, input.vout));
    }
  }
  return [...byOutpoint.values()];
}

/**
 * The operations kept and the unspent outputs, from the merged operations and the UTXO set with
 * the mempool applied: replaced pending transactions and their outputs go, and of the operations
 * spending the same outpoints only the best one keeps its outputs.
 */
export function reconcile(
  operations: AccountOperation[],
  utxos: UtxoState[],
  now: number,
  expiryMs?: number,
): { operations: AccountOperation[]; utxos: UtxoState[] } {
  const shown = removeReplaced(operations, now, false, expiryMs);
  const settled = removeReplaced(operations, now, true, expiryMs);
  const settledHashes = new Set(settled.map(op => op.hash));
  const removedHashes = new Set(
    operations.filter(op => !settledHashes.has(op.hash)).map(op => op.hash),
  );

  const unspent = utxos.filter(
    utxo => utxo.height !== null || !utxo.replaceable || !removedHashes.has(utxo.txid),
  );
  const unspentHashes = new Set(unspent.map(u => u.txid));
  const finalHashes = new Set(settled.filter(op => unspentHashes.has(op.hash)).map(op => op.hash));

  return {
    operations: shown,
    utxos: finalHashes.size > 0 ? unspent.filter(u => finalHashes.has(u.txid)) : unspent,
  };
}
