import { FeeEstimation } from "@ledgerhq/coin-framework/api/types";
import { getTransactionParams } from "../network";

// Single signature size in bytes
const SINGLE_SIGNATURE_SIZE = 71;

// Average transaction size for fee estimation
const AVERAGE_TX_SIZE = 250;

/**
 * Estimate fees for an Algorand transaction
 * @param txSize - Optional transaction size in bytes (defaults to average)
 * @returns Fee estimation
 */
export async function estimateFees(txSize?: number): Promise<FeeEstimation> {
  const params = await getTransactionParams();

  const size = txSize ?? AVERAGE_TX_SIZE;
  const suggestedFees = params.fee > 0 ? params.fee * (size + SINGLE_SIGNATURE_SIZE) : 0;
  const fees = Math.max(suggestedFees, params.minFee);

  return {
    value: BigInt(fees),
  };
}

/**
 * Get minimum fee for Algorand network
 * @returns Minimum fee in microAlgos
 */
export async function getMinFee(): Promise<bigint> {
  const params = await getTransactionParams();
  return BigInt(params.minFee);
}
