import { createApi } from "@ledgerhq/coin-bitcoin/api/index";
import type { BitcoinContext } from "@ledgerhq/coin-bitcoin/config";
import { buildContext } from "@ledgerhq/live-common/bridge/generic-coin-framework/api/context";
import { toSatoshis } from "./helpers";
import type { NodeTransaction } from "./helpers";

export type HoldingSummary = { id: string; value: string };

const api = createApi("bitcoin_regtest");

const byId = (a: HoldingSummary, b: HoldingSummary) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * The address's spendable outputs by coin-bitcoin's `listHoldings`, with the scenario's context
 * (the configuration the generic bridge reads), sorted by id.
 */
export async function listAllHoldings(address: string): Promise<HoldingSummary[]> {
  const context = buildContext("bitcoin_regtest") as unknown as BitcoinContext;
  const holdings: HoldingSummary[] = [];
  let cursor: string | undefined;
  do {
    const page = await api.listHoldings(context, address, { cursor });
    for (const item of page.items) holdings.push({ id: item.id, value: item.value.toString() });
    cursor = page.next;
  } while (cursor);
  return holdings.sort(byId);
}

/** What the address holds after `tx` confirms: what it held minus what `tx` spends, plus what `tx` pays it. */
export function holdingsAfter(
  before: HoldingSummary[],
  spent: string[],
  tx: NodeTransaction,
  address: string,
): HoldingSummary[] {
  const received = tx.vout
    .filter(output => output.scriptPubKey.address === address)
    .map(output => ({ id: `${tx.txid}:${output.n}`, value: toSatoshis(output.value).toString() }));
  return [...before.filter(holding => !spent.includes(holding.id)), ...received].sort(byId);
}
