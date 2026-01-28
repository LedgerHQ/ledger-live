import { broadcastTx } from "../network/api";
import type { BroadcastTransactionRequest } from "../types";

/**
 * Broadcast a signed transaction to the Filecoin network.
 *
 * @param signedTx - JSON string from combine() containing the signed transaction
 * @returns Transaction hash
 * @throws Error if signedTx is malformed JSON
 */
export async function broadcast(signedTx: string): Promise<string> {
  // Parse the signed transaction from combine()
  let parsed: BroadcastTransactionRequest;
  try {
    parsed = JSON.parse(signedTx);
  } catch {
    throw new Error("Invalid signed transaction: malformed JSON");
  }

  // Validate required fields
  if (!parsed.message || !parsed.signature) {
    throw new Error("Invalid signed transaction: missing message or signature");
  }

  // Broadcast to the network
  const result = await broadcastTx(parsed);

  return result.hash;
}
