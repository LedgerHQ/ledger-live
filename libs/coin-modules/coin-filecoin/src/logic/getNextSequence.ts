import { fetchEstimatedFees } from "../api/api";
import { BroadcastBlockIncl } from "../types";

/**
 * Returns the next expected nonce for a Filecoin address.
 *
 * Filecoin uses a monotonic nonce (sequence number) per actor. The backend
 * API returns the current nonce in the fee estimation response, which always
 * reflects the actor's latest confirmed state.
 */
export async function getNextSequence(address: string): Promise<bigint> {
  const response = await fetchEstimatedFees({
    from: address,
    blockIncl: BroadcastBlockIncl,
  });
  return BigInt(response.nonce);
}
