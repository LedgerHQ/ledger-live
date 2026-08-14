import { FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import type { AlgorandContext } from "../config";
import { getTransactionParams } from "../network";

// Single signature size in bytes
const SINGLE_SIGNATURE_SIZE = 71;

// Average transaction size for fee estimation
const AVERAGE_TX_SIZE = 250;

/**
 * Estimate fees for an Algorand transaction
 * @param context - The coin-module context (config + logger)
 * @param txSize - Optional transaction size in bytes (defaults to average)
 * @returns Fee estimation
 */
export async function estimateFees(
  context: AlgorandContext,
  txSize?: number,
): Promise<FeeEstimation> {
  const config = await context.config();
  const params = await getTransactionParams(config);

  const size = txSize ?? AVERAGE_TX_SIZE;
  const suggestedFees = params.fee > 0 ? params.fee * (size + SINGLE_SIGNATURE_SIZE) : 0;
  const fees = Math.max(suggestedFees, params.minFee);

  return {
    value: BigInt(fees),
  };
}
