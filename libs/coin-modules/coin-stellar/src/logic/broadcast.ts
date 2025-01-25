import { broadcastTransaction } from "../network";

export async function broadcast(signature: string): Promise<string> {
  return broadcastTransaction(signature);
}
