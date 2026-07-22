import { getZainoEndpoint } from "../../constants";
import { getZCashClient } from "../engineClient";

/**
 * Broadcasts a signed V5 transaction over the Zaino gRPC endpoint. Every
 * Zcash send (including t→t) goes through this path -- coin-zcash never
 * falls back to the standard explorer broadcast.
 */
export async function broadcast(txHex: string): Promise<string> {
  const { grpcUrl, network } = getZainoEndpoint();
  const client = await getZCashClient({ grpcUrl, network });

  if (!client.broadcastTransaction) {
    throw new Error("Shielded Zcash transactions are not supported in this environment");
  }

  return client.broadcastTransaction(grpcUrl, txHex);
}
