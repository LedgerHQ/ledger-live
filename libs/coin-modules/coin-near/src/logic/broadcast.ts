import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import type { NearContext } from "../config";
import { broadcastTransaction } from "../network";

/**
 * Submit a signed transaction (base64, from {@link combine}) and return its hash. The retry on the
 * node's 10-second timeout lives in the network layer.
 */
export async function broadcast(
  context: NearContext,
  tx: string,
  _broadcastConfig?: BroadcastConfig,
): Promise<string> {
  const config = await context.config();
  return broadcastTransaction(config, tx);
}
