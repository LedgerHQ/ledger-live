import { Fees, Intent } from "@ledgerhq/coin-framework/lib/api/types";
import { fetchBaseFee } from "../network";

/**
 * Estimate the fees for one transaction
 * @see {@link https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering#inclusion-fee}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function estimateFees(intent: Intent): Promise<Fees> {
  const baseFee = await fetchBaseFee();
  return {
    standard: BigInt(baseFee.recommendedFee),
  };
}
