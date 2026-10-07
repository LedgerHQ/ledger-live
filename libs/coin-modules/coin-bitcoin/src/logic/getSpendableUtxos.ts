import type { BitcoinCoinConfig } from "../config";
import { fetchPendingUtxos, fetchTx, fetchUtxos } from "../network/explorer";
import type { ExplorerTx, ExplorerUtxo } from "../network/types";

const outpoint = (hash: string, outputIndex: number) => `${hash}:${outputIndex}`;

/** Unconfirmed transactions fetched at once, so many pending transactions do not flood the explorer. */
const PENDING_TX_CONCURRENCY = 8;

async function fetchTxs(
  config: BitcoinCoinConfig,
  currencyId: string,
  txids: string[],
): Promise<ExplorerTx[]> {
  const txs: ExplorerTx[] = [];
  for (let start = 0; start < txids.length; start += PENDING_TX_CONCURRENCY) {
    const batch = txids.slice(start, start + PENDING_TX_CONCURRENCY);
    txs.push(...(await Promise.all(batch.map(txid => fetchTx(config, currencyId, txid)))));
  }
  return txs;
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
  currencyId: string,
  address: string,
): Promise<ExplorerUtxo[]> {
  const [confirmed, pending] = await Promise.all([
    fetchUtxos(config, currencyId, address),
    fetchPendingUtxos(config, currencyId, address),
  ]);
  const spent = new Set(pending.spent.map(utxo => outpoint(utxo.hash, utxo.outputIndex)));

  const pendingTxids = [...new Set(pending.created.map(utxo => utxo.hash))];
  const pendingTxs = spent.size === 0 ? [] : await fetchTxs(config, currencyId, pendingTxids);
  const ownTxids = new Set(
    pendingTxs
      .filter(tx =>
        tx.inputs.some(input => {
          const spentTxid = input.output_tx_id ?? input.output_hash;
          return (
            typeof spentTxid === "string" &&
            typeof input.output_index === "number" &&
            spent.has(outpoint(spentTxid, input.output_index))
          );
        }),
      )
      .map(tx => tx.id ?? tx.hash),
  );
  const ownChange = pending.created.filter(utxo => ownTxids.has(utxo.hash));

  const spendable = new Map<string, ExplorerUtxo>();
  for (const utxo of [...confirmed, ...ownChange]) {
    const key = outpoint(utxo.hash, utxo.outputIndex);
    if (!spent.has(key) && !spendable.has(key)) spendable.set(key, utxo);
  }
  return [...spendable.values()];
}
