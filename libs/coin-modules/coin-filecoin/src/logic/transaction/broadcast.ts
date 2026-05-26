import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/index";
import { broadcastTx } from "../../api/api";
import { BroadcastTransactionRequest } from "../../types";

/**
 * Broadcasts a signed transaction to the Filecoin network.
 *
 * @param signedTx - JSON string produced by `combine()` containing the full
 *   `BroadcastTransactionRequest` (message + signature).
 * @param _broadcastConfig - Optional broadcast configuration (unused for Filecoin).
 * @returns The transaction hash.
 * @throws If the network rejects the transaction or returns an error in a 200 response.
 */
export async function broadcast(signedTx: string, _broadcastConfig?: BroadcastConfig): Promise<string> {
  const request: BroadcastTransactionRequest = JSON.parse(signedTx);
  const response = await broadcastTx(request);

  // Guard against silent failure: API may return 200 with empty/missing hash
  if (!response.hash) {
    throw new Error(
      "Broadcast failed: API returned success but no transaction hash. " +
        "Response: " +
        JSON.stringify(response),
    );
  }

  return response.hash;
}
