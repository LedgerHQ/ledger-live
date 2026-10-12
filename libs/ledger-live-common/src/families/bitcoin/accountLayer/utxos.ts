import { BigNumber } from "bignumber.js";
import { removeReplaced } from "@ledgerhq/wallet-btc/operations";
import type { BitcoinTxDetails } from "@ledgerhq/coin-bitcoin/api";
import type { BitcoinOutput, BitcoinStateUtxo, BtcOperation } from "../types";
import { displayAddress } from "./interpret";

const RBF_SEQUENCE_THRESHOLD = 0xfffffffe;

const outpoint = (txid: string, vout: number) => `${txid}:${vout}`;

/** BIP125: a transaction is replaceable when one of its inputs signals it. */
export const isRbfTx = (tx: BitcoinTxDetails): boolean =>
  tx.inputs.some(input => input.sequence < RBF_SEQUENCE_THRESHOLD);

function ownOutputs(tx: BitcoinTxDetails, ownAddresses: ReadonlySet<string>): BitcoinStateUtxo[] {
  const rbf = isRbfTx(tx);
  return tx.outputs
    .filter(o => o.address && ownAddresses.has(o.address))
    .map(o => ({
      txid: tx.id,
      vout: o.index,
      value: o.value,
      address: o.address as string,
      blockHeight: tx.block?.height ?? 0,
      rbf,
    }));
}

/**
 * Brings the confirmed UTXO set forward with newly confirmed transactions. Every output first, then
 * every spend: within one batch an input can be listed before the output it spends, and a
 * transaction fetched again (sync rewind) must neither resurrect nor duplicate an output.
 */
export function applyConfirmedTxs(
  confirmedUtxos: BitcoinStateUtxo[],
  confirmedTxs: BitcoinTxDetails[],
  ownAddresses: ReadonlySet<string>,
): BitcoinStateUtxo[] {
  const byOutpoint = new Map(confirmedUtxos.map(u => [outpoint(u.txid, u.vout), u]));
  for (const tx of confirmedTxs) {
    for (const utxo of ownOutputs(tx, ownAddresses))
      byOutpoint.set(outpoint(utxo.txid, utxo.vout), utxo);
  }
  for (const tx of confirmedTxs) {
    for (const input of tx.inputs) {
      if (input.txid) byOutpoint.delete(outpoint(input.txid, input.vout));
    }
  }
  return [...byOutpoint.values()];
}

type RawUtxo = BitcoinStateUtxo & { pending: boolean };

/** The confirmed set with the mempool applied: pending spends removed, pending outputs added. */
export function withMempool(
  confirmedUtxos: BitcoinStateUtxo[],
  pendingTxs: BitcoinTxDetails[],
  ownAddresses: ReadonlySet<string>,
): RawUtxo[] {
  const byOutpoint = new Map<string, RawUtxo>(
    confirmedUtxos.map(u => [outpoint(u.txid, u.vout), { ...u, pending: false }]),
  );
  for (const tx of pendingTxs) {
    for (const utxo of ownOutputs(tx, ownAddresses)) {
      byOutpoint.set(outpoint(utxo.txid, utxo.vout), { ...utxo, pending: true });
    }
  }
  for (const tx of pendingTxs) {
    for (const input of tx.inputs) {
      if (input.txid) byOutpoint.delete(outpoint(input.txid, input.vout));
    }
  }
  return [...byOutpoint.values()];
}

const toBitcoinOutput = (
  utxo: RawUtxo,
  currencyId: string,
  changeAddresses: ReadonlySet<string>,
): BitcoinOutput => ({
  hash: utxo.txid,
  outputIndex: utxo.vout,
  blockHeight: utxo.pending ? null : utxo.blockHeight,
  address: displayAddress(currencyId, utxo.address),
  value: new BigNumber(utxo.value),
  rbf: utxo.rbf,
  isChange: changeAddresses.has(utxo.address),
});

const getInputsKey = (op: BtcOperation): string | null => {
  const inputs = op.extra?.inputs;
  if (!Array.isArray(inputs) || inputs.length === 0) return null;
  return [...inputs].sort().join("|");
};

const isBetterCandidate = (candidate: BtcOperation, existing: BtcOperation): boolean => {
  const candidateConfirmed = typeof candidate.blockHeight === "number";
  const existingConfirmed = typeof existing.blockHeight === "number";
  if (candidateConfirmed !== existingConfirmed) return candidateConfirmed;
  const candidateHeight = candidate.blockHeight ?? -1;
  const existingHeight = existing.blockHeight ?? -1;
  if (candidateHeight !== existingHeight) return candidateHeight > existingHeight;
  return new Date(candidate.date).getTime() > new Date(existing.date).getTime();
};

/**
 * Spendable UTXOs and the operations shown, from the merged operations and the raw UTXO set —
 * coin-bitcoin's sync rules, unchanged: RBF-replaced pending transactions and their outputs go,
 * and of the operations spending the same inputs only the best one keeps its outputs.
 */
export function reconcile(
  mergedOperations: BtcOperation[],
  rawUtxos: RawUtxo[],
  currencyId: string,
  changeAddresses: ReadonlySet<string>,
  now: number = Date.now(),
): { operations: BtcOperation[]; utxos: BitcoinOutput[] } {
  const operations = removeReplaced(mergedOperations, now);
  const balanceOperations = removeReplaced(mergedOperations, now, true);
  const keptHashes = new Set(balanceOperations.map(op => op.hash));
  const removedHashes = new Set(
    mergedOperations.filter(op => !keptHashes.has(op.hash)).map(op => op.hash),
  );

  const utxos = rawUtxos
    .filter(utxo => !utxo.pending || !utxo.rbf || !removedHashes.has(utxo.txid))
    .map(utxo => toBitcoinOutput(utxo, currencyId, changeAddresses));

  const utxoHashes = new Set(utxos.map(u => u.hash));
  const operationsOfUtxos = balanceOperations.filter(op => utxoHashes.has(op.hash));

  const bestOpByInputsKey = new Map<string, BtcOperation>();
  for (const op of operationsOfUtxos) {
    const key = getInputsKey(op);
    if (!key) continue;
    const existing = bestOpByInputsKey.get(key);
    if (!existing || isBetterCandidate(op, existing)) bestOpByInputsKey.set(key, op);
  }
  const finalOperationsOfUtxos = operationsOfUtxos.filter(op => {
    const key = getInputsKey(op);
    return !key || bestOpByInputsKey.get(key)?.hash === op.hash;
  });
  const finalHashes = new Set(finalOperationsOfUtxos.map(op => op.hash));

  return {
    operations,
    utxos: finalHashes.size > 0 ? utxos.filter(u => finalHashes.has(u.hash)) : utxos,
  };
}
