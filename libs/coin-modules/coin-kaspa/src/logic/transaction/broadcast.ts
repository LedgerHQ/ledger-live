import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import { submitTransaction } from "../../network";

/**
 * Submit a signed Kaspa transaction (as produced by `logic/combine`) to the network. Guards
 * against a 2xx response missing the transaction id — mirrors the existing
 * `bridge/broadcast.ts` guard ("kaspa: broadcast returned no transaction id").
 */
export async function broadcast(tx: string, _broadcastConfig?: BroadcastConfig): Promise<string> {
  const { txId } = await submitTransaction(tx);
  if (!txId) {
    throw new Error("kaspa: broadcast returned no transaction id");
  }
  return txId;
}
