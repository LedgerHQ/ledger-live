import { broadcastTransaction } from "../network/node";

export async function broadcast(signedTx: string): Promise<string> {
  return broadcastTransaction(signedTx);
}
