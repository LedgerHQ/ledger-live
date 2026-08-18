import type { AlgorandContext } from "../config";
import { broadcastTransaction as networkBroadcast } from "../network";

/**
 * Broadcast a signed transaction to the Algorand network
 * @param context - The coin-module context (config + logger)
 * @param signedTx - The signed transaction as a hex string
 * @returns The transaction hash
 */
export async function broadcast(context: AlgorandContext, signedTx: string): Promise<string> {
  const config = await context.config();
  const payload = Buffer.from(signedTx, "hex");
  return networkBroadcast(config, payload);
}
