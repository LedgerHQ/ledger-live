import type { BitcoinCoinConfig } from "../config";
import { fetchPendingUtxos, fetchTx, fetchUtxos } from "../network/explorer";
import type { ExplorerPendingUtxos, ExplorerTx, ExplorerUtxo } from "../network/types";
import { txidOf } from "../network/types";
import { explorerAddress } from "./cashaddr";

/** The `txid:vout` identifier of an output. */
export const outpoint = (hash: string, outputIndex: number) => `${hash}:${outputIndex}`;

/** Unconfirmed transactions fetched at once, so many pending transactions do not flood the explorer. */
const PENDING_TX_CONCURRENCY = 8;

async function fetchTxs(config: BitcoinCoinConfig, txids: string[]): Promise<ExplorerTx[]> {
  const txs: ExplorerTx[] = [];
  for (let start = 0; start < txids.length; start += PENDING_TX_CONCURRENCY) {
    const batch = txids.slice(start, start + PENDING_TX_CONCURRENCY);
    txs.push(...(await Promise.all(batch.map(txid => fetchTx(config, txid)))));
  }
  return txs;
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
  const pendingTxs = spent.size === 0 ? [] : await fetchTxs(config, pendingTxids);
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
