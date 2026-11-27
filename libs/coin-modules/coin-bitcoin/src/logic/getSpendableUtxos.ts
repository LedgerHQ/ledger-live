import type { BitcoinCoinConfig } from "../config";
import {
  fetchPendingTx,
  fetchPendingTxHex,
  fetchPendingUtxos,
  fetchUtxos,
} from "../network/explorer";
import type { ExplorerPendingUtxos, ExplorerTx, ExplorerUtxo } from "../network/types";
import { txidOf } from "../network/types";
import { explorerAddress } from "./cashaddr";

/** The `txid:vout` identifier of an output. */
export const outpoint = (hash: string, outputIndex: number) =>
  // Lowercased as the coin control parses ids, so an explorer hash compares whatever its case.
  `${hash.toLowerCase()}:${outputIndex}`;

/** Unconfirmed transactions fetched at once, so many pending transactions do not flood the explorer. */
export const PENDING_TX_CONCURRENCY = 8;

/**
 * The transaction while the explorer still holds it unmined, else `undefined`. The explorer keeps
 * listing a replaced or dropped transaction as pending for minutes, and keeps describing it at
 * `tx/{hash}`, but no longer serves its raw transaction: its outputs must not be offered as change.
 */
async function fetchLivePendingTx(
  config: BitcoinCoinConfig,
  txid: string,
): Promise<ExplorerTx | undefined> {
  const [tx, hex] = await Promise.all([
    fetchPendingTx(config, txid),
    fetchPendingTxHex(config, txid),
  ]);
  return tx && !tx.block && hex !== undefined ? tx : undefined;
}

/** Looks up each unconfirmed transaction, `PENDING_TX_CONCURRENCY` at a time, in order. */
export function lookUpPendingTxs<T>(
  txids: string[],
  lookUp: (txid: string) => Promise<T>,
): Promise<T[]> {
  const batches: string[][] = [];
  for (let start = 0; start < txids.length; start += PENDING_TX_CONCURRENCY) {
    batches.push(txids.slice(start, start + PENDING_TX_CONCURRENCY));
  }
  // One batch after the other.
  return batches.reduce<Promise<T[]>>(
    async (previous, batch) => [...(await previous), ...(await Promise.all(batch.map(lookUp)))],
    Promise.resolve([]),
  );
}

async function fetchLivePendingTxs(
  config: BitcoinCoinConfig,
  txids: string[],
): Promise<ExplorerTx[]> {
  const txs = await lookUpPendingTxs(txids, txid => fetchLivePendingTx(config, txid));
  return txs.filter((tx): tx is ExplorerTx => tx !== undefined);
}

/** The outpoints an unconfirmed transaction spends. */
export const mempoolSpent = (pending: ExplorerPendingUtxos): Set<string> =>
  new Set(pending.spent.map(utxo => outpoint(utxo.hash, utxo.outputIndex)));

/** What the mempool says about an address (see {@link fetchMempoolView}). */
export type MempoolView = {
  /** Outpoints an unconfirmed transaction spends. */
  spent: Set<string>;
  /** The outputs behind `spent`, with value and script: what a replacement spends again. */
  spentUtxos: ExplorerUtxo[];
  /** The address's own unconfirmed outputs, i.e. its change. */
  ownChange: ExplorerUtxo[];
  /** Outpoint to the txid of the own unconfirmed transaction that spends it. */
  spentBy: Map<string, string>;
  /** Txid of an own unconfirmed transaction to its outputs to the address. */
  createdBy: Map<string, ExplorerUtxo[]>;
};

/**
 * What the mempool says about an address: the outpoints an unconfirmed transaction spends, and the
 * unconfirmed outputs that are the address's own change (see {@link getSpendableUtxos} for why that
 * distinction matters), with the own transactions that spend and create them (what replacing one
 * needs).
 */
export async function fetchMempoolView(
  config: BitcoinCoinConfig,
  queriedAddress: string,
): Promise<MempoolView> {
  const pending = await fetchPendingUtxos(config, queriedAddress);
  const spent = mempoolSpent(pending);

  const pendingTxids = [...new Set(pending.created.map(utxo => utxo.hash))];
  // A transaction replaced or dropped since stays listed for minutes: its change is left out, so it
  // is neither held nor spent. What it spent stays out of the spendable outputs, which is safe.
  const pendingTxs = spent.size === 0 ? [] : await fetchLivePendingTxs(config, pendingTxids);
  const spentBy = new Map<string, string>();
  for (const tx of pendingTxs) {
    for (const input of tx.inputs) {
      const spentTxid = input.output_tx_id ?? input.output_hash;
      if (typeof spentTxid !== "string" || typeof input.output_index !== "number") continue;
      const id = outpoint(spentTxid, input.output_index);
      if (spent.has(id)) spentBy.set(id, txidOf(tx));
    }
  }
  const ownTxids = new Set(spentBy.values());
  const ownChange = pending.created.filter(utxo => ownTxids.has(utxo.hash));
  const createdBy = new Map<string, ExplorerUtxo[]>();
  for (const utxo of ownChange)
    createdBy.set(utxo.hash, [...(createdBy.get(utxo.hash) ?? []), utxo]);
  return { spent, spentUtxos: pending.spent, ownChange, spentBy, createdBy };
}

/**
 * Outputs a single-address transaction may spend, each once: the confirmed unspent outputs, and the
 * change of the address's own unconfirmed transactions, minus every output an unconfirmed
 * transaction already spends.
 *
 * This is the bridge's rule (`ledger-live-common/src/families/bitcoin/docs/RBF.md`, wallet-btc
 * `estimateAccountMaxSpendable`): an unconfirmed payment from someone else is not spent, since its
 * sender can still replace it; the account's own change is, since only the account can replace the
 * transaction that creates it. With a single address, change returns to the sender, so an
 * unconfirmed output is the account's change exactly when its transaction spends one of the
 * address's outputs: one the explorer lists as spent in the mempool.
 *
 * Spending a confirmed output that a mempool transaction already spends would build a conflicting
 * transaction, which the node would refuse.
 */
export async function getSpendableUtxos(
  config: BitcoinCoinConfig,
  address: string,
): Promise<ExplorerUtxo[]> {
  return (await getSpendableUtxosWithMempool(config, address)).spendable;
}

/** The spendable outputs of {@link getSpendableUtxos}, with the mempool view they derive from. */
export async function getSpendableUtxosWithMempool(
  config: BitcoinCoinConfig,
  address: string,
): Promise<{ spendable: ExplorerUtxo[]; mempool: MempoolView }> {
  const queried = explorerAddress(config, address);
  const [confirmed, mempool] = await Promise.all([
    fetchUtxos(config, queried),
    fetchMempoolView(config, queried),
  ]);
  const { spent, ownChange } = mempool;

  const spendable = new Map<string, ExplorerUtxo>();
  for (const utxo of [...confirmed, ...ownChange]) {
    const key = outpoint(utxo.hash, utxo.outputIndex);
    if (!spent.has(key) && !spendable.has(key)) spendable.set(key, utxo);
  }
  return { spendable: Array.from(spendable.values()), mempool };
}
