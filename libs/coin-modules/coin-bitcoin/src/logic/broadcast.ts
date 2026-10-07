import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../config";
import { sendRawTransaction } from "../network/explorer";

/**
 * Broadcasts a signed transaction and returns its id.
 *
 * `tx` is the signed raw transaction, hex-encoded, as returned by `combine`. It is sent as is, so
 * any transaction format the explorer accepts is broadcast. The node validates it, double spends
 * included: its rejection, and an answer without a transaction id, are thrown.
 */
export async function broadcast(
  context: BitcoinContext,
  currencyId: string,
  tx: string,
  broadcastConfig?: Pick<BroadcastConfig, "source">,
): Promise<string> {
  const config = await context.config(currencyId);
  const txid = await sendRawTransaction(config, currencyId, tx, broadcastConfig?.source);
  if (!txid) {
    throw new Error("broadcast returned no transaction id");
  }
  return txid;
}
