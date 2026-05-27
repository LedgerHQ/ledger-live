import { fetchEstimatedFees } from "../api/api";
import { validateAddress } from "../network/addresses";

export async function getNextSequence(address: string): Promise<bigint> {
  const validation = validateAddress(address);
  if (!validation.isValid) throw new Error("Invalid address");

  const result = await fetchEstimatedFees({
    from: validation.parsedAddress.toString(),
  });

  return BigInt(result.nonce);
}
