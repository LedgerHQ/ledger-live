import type { Holding, ListHoldingsOptions, Page } from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../config";
import { fetchUtxoPage } from "../network/explorer";
import type { ExplorerUtxo } from "../network/types";
import { explorerAddress } from "./cashaddr";
import { fetchMempoolView, outpoint } from "./getSpendableUtxos";

const toHolding = (utxo: ExplorerUtxo): Holding => ({
  id: outpoint(utxo.hash, utxo.outputIndex),
  asset: { type: "native" },
  value: BigInt(utxo.value),
  height: utxo.height ?? null,
});

/**
 * One page of the address's spendable outputs, by the rule `getSpendableUtxos` applies: the
 * explorer's confirmed unspent outputs minus those an unconfirmed transaction spends. The
 * address's own unconfirmed change is not in the explorer's list, so it comes with the first page,
 * with a `null` height.
 *
 * A page is one explorer page (`next` is the explorer's cursor), so it can be empty while more
 * follow. The mempool view is read afresh on every call: the listing is a snapshot, not a
 * consistent cut across pages.
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
  const [page, { spent, ownChange }] = await Promise.all([
    fetchUtxoPage(config, queried, cursor),
    fetchMempoolView(config, queried),
  ]);

  // The explorer can list an own transaction's output more than once.
  const holdings = new Map<string, Holding>();
  for (const utxo of cursor ? page.utxos : [...page.utxos, ...ownChange]) {
    const holding = toHolding(utxo);
    if (!spent.has(holding.id) && !holdings.has(holding.id)) holdings.set(holding.id, holding);
  }
  const items = Array.from(holdings.values());

  // A cursor handed back unchanged would page forever: the explorer is misbehaving.
  if (page.token && page.token === cursor) {
    throw new Error("explorer repeated a UTXO page cursor");
  }
  return page.token ? { items, next: page.token } : { items };
}
