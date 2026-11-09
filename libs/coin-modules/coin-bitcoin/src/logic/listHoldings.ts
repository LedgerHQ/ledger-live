import type { Holding, ListHoldingsOptions, Page } from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../config";
import { fetchPendingUtxos, fetchUtxoPage } from "../network/explorer";
import type { ExplorerUtxo } from "../network/types";
import { explorerAddress } from "./cashaddr";
import { fetchMempoolView, mempoolSpent, outpoint } from "./getSpendableUtxos";

// `height` is absent when the explorer does not say (unknown), null only for unconfirmed change.
const toHolding = (utxo: ExplorerUtxo, height: number | null | undefined): Holding => ({
  id: outpoint(utxo.hash, utxo.outputIndex),
  asset: { type: "native" },
  value: BigInt(utxo.value),
  ...(height === undefined ? {} : { height }),
});

/**
 * One page of the address's spendable outputs, by the rule `getSpendableUtxos` applies: the
 * explorer's confirmed unspent outputs minus those an unconfirmed transaction spends. The
 * address's own unconfirmed change is not in the explorer's list, so it comes with the first page,
 * with a `null` height.
 *
 * A page is one explorer page (`next` is the explorer's cursor), so it can be empty while more
 * follow. The mempool view is read afresh on every call, so pages are snapshots, not a consistent
 * cut: the same id can appear on two pages when own unconfirmed change confirms between calls, so
 * callers de-duplicate by id. Later pages only need the mempool-spent outpoints, not the change.
 */
export async function listHoldings(
  context: BitcoinContext,
  currencyId: string,
  address: string,
  options?: ListHoldingsOptions,
): Promise<Page<Holding>> {
  // The address holds no other asset than the native coin.
  if (options?.asset && options.asset.type !== "native") return { items: [] };

  const config = await context.config(currencyId);
  const queried = explorerAddress(config, address);
  const cursor = options?.cursor;
  let page;
  let spent: Set<string>;
  let ownChange: ExplorerUtxo[] = [];
  if (cursor) {
    let pending;
    [page, pending] = await Promise.all([
      fetchUtxoPage(config, queried, cursor),
      fetchPendingUtxos(config, queried),
    ]);
    spent = mempoolSpent(pending);
  } else {
    let view;
    [page, view] = await Promise.all([
      fetchUtxoPage(config, queried),
      fetchMempoolView(config, queried),
    ]);
    ({ spent, ownChange } = view);
  }

  // The explorer can list an own transaction's output more than once.
  const holdings = new Map<string, Holding>();
  const add = (utxo: ExplorerUtxo, height: number | null | undefined) => {
    const holding = toHolding(utxo, height);
    if (!spent.has(holding.id) && !holdings.has(holding.id)) holdings.set(holding.id, holding);
  };
  for (const utxo of page.utxos) add(utxo, utxo.height ?? undefined);
  for (const utxo of ownChange) add(utxo, null);
  const items = Array.from(holdings.values());

  // A cursor handed back unchanged would page forever: the explorer is misbehaving.
  if (page.token && page.token === cursor) {
    throw new Error("explorer repeated a UTXO page cursor");
  }
  return page.token ? { items, next: page.token } : { items };
}
