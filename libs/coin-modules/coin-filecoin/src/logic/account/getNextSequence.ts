import { fetchEstimatedFees } from "../../network/api";
import type { FilecoinCoinConfig } from "../../config";

// The Filecoin REST API has no standalone nonce endpoint. We derive the nonce
// from the fee-estimation response, which includes the current account nonce.
export async function getNextSequence(
  config: FilecoinCoinConfig,
  address: string,
): Promise<bigint> {
  const result = await fetchEstimatedFees(config, { from: address, to: address });
  return BigInt(result.nonce);
}
