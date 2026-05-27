import { broadcastTx } from "../api/api";
import type { BroadcastTransactionRequest } from "../types";

/**
 * Broadcast a signed Filecoin transaction.
 *
 * The `tx` argument is the JSON-serialised {@link BroadcastTransactionRequest}
 * produced by {@link combine}.
 */
export async function broadcast(tx: string): Promise<string> {
  const request: BroadcastTransactionRequest = JSON.parse(tx);
  const response = await broadcastTx(request);
  return response.hash;
}
