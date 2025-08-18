import { fetchAccountNetworkInfo } from "../network";

/**
 * Estimate the fees for one transaction
 * @see {@link https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering#inclusion-fee}
 */
export async function estimateFees(account: string): Promise<bigint> {
  const { fees } = await fetchAccountNetworkInfo(account);
  return BigInt(fees.toString());
}
