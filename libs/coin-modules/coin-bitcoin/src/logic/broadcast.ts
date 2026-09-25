import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../api/config";
import { broadcastTx } from "../network";

/**
 * Broadcast a raw signed transaction and return its transaction id.
 *
 * MUST throw on failure — an empty/absent id from the explorer is treated as an error and never
 * swallowed (a HTTP 200 with no result must not look like success).
 */
export async function broadcast(
  context: BitcoinContext,
  currencyId: string,
  tx: string,
  broadcastConfig?: Pick<BroadcastConfig, "source">,
): Promise<string> {
  const config = await context.config(currencyId);
  const txId = await broadcastTx(currencyId, tx, config, broadcastConfig);
  if (!txId) {
    throw new Error("broadcast: explorer returned an empty transaction id");
  }
  return txId;
}
