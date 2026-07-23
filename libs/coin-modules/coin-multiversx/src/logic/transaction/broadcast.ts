import type { MultiversXNetworkApi } from "../../network/api";

/**
 * Broadcast a signed MultiversX transaction to the network.
 *
 * The `tx` argument is a JSON-serialized MultiversXProtocolTransaction
 * with the `signature` field already attached (as produced by `combine`).
 *
 * Throws if the API returns an empty or missing txHash.
 */
export async function broadcast(api: MultiversXNetworkApi, tx: string): Promise<string> {
  const txHash = await api.submit(tx);
  if (!txHash) {
    throw new Error("broadcast failed: txHash missing in response");
  }
  return txHash;
}
