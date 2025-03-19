import { fetchBaseFee } from "../network";

/**
 * Estimate the fees for one transaction
 * @see {@link https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering#inclusion-fee}
 */
export async function estimateFees(): Promise<bigint> {
  const baseFee = await fetchBaseFee();
  return BigInt(baseFee.recommendedFee);
}
