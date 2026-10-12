import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import type { Explorer } from "../network/explorer";

// A transaction never changes once broadcast, so its hex is kept: the fee estimation, the validation
// and the crafting of a replacement each need the same previous transactions.
const cachedTxHex = makeLRUCache(
  async (explorer: Explorer, txid: string) => explorer.getTxHex(txid),
  (explorer, txid) => `${explorer.baseUrl}:${txid}`,
  minutes(10, 1000),
);

export const getTxHex = (explorer: Explorer, txid: string): Promise<string> =>
  cachedTxHex(explorer, txid);
