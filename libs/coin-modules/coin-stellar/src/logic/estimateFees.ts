import { TransactionIntent } from "@ledgerhq/coin-framework/lib/api/types";
import { fetchBaseFee } from "../network";
import { StellarToken } from "../types";

/**
 * Estimate the fees for one transaction
 * @see {@link https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering#inclusion-fee}
 */
export async function estimateFees(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transactionIntent: TransactionIntent<StellarToken>,
): Promise<bigint> {
  const baseFee = await fetchBaseFee();
  return BigInt(baseFee.recommendedFee);
}
