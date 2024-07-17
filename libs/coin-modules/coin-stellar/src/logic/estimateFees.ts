import { fetchBaseFee } from "../network";

export async function estimateFees(): Promise<bigint> {
  const fees = await fetchBaseFee();
  return BigInt(fees.recommendedFee);
}
