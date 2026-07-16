import { fetchEstimatedFees } from "../../network/api";

// The Filecoin REST API has no standalone nonce endpoint. We derive the nonce
// from the fee-estimation response, which includes the current account nonce.
export async function getNextSequence(address: string): Promise<bigint> {
  const result = await fetchEstimatedFees({ from: address, to: address });
  return BigInt(result.nonce);
}
