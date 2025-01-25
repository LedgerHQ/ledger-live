import { fetchBaseFee } from "../network";

/**
 * Estimate the fees for one transaction
 * @see {@link https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering#inclusion-fee}
 */
export async function estimateFees(): Promise<bigint> {
  const fees = await fetchBaseFee();
  return BigInt(fees.recommendedFee);
}
