import { broadcastTransaction as networkBroadcast } from "../network";

/**
 * Broadcast a signed transaction to the Algorand network
 * @param signedTx - The signed transaction as a hex string
 * @returns The transaction hash
 */
export async function broadcast(signedTx: string): Promise<string> {
  const payload = Buffer.from(signedTx, "hex");
  const txId = await networkBroadcast(payload);
  return txId;
}
