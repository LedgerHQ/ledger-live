import { CosmosAPI } from "../../network/Cosmos";

/**
 * Thin wrapper over {@link CosmosAPI.broadcastRawTransaction}, which does the
 * error handling (rejects a non-zero code or empty hash).
 */
export async function broadcast(api: CosmosAPI, tx: string): Promise<string> {
  return api.broadcastRawTransaction(tx);
}
