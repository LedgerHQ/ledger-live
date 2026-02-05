import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { log } from "@ledgerhq/logs";
import { TransactionType } from "@ledgerhq/hw-app-concordium/lib/types";
import { CONCORDIUM_ENERGY } from "../../constants";
import { getTransactionCost } from "../../network/proxyClient";

/**
 * Returns the default fallback energy for a given transaction type.
 * Used when fee estimation fails (network error, rate limiting, etc.)
 * to ensure transactions have sufficient energy to be processed.
 */
function getDefaultEnergy(transactionType: TransactionType): bigint {
  if (transactionType === TransactionType.TransferWithMemo) {
    return CONCORDIUM_ENERGY.TRANSFER_WITH_MEMO_MAX;
  }
  return CONCORDIUM_ENERGY.DEFAULT;
}

/**
 * Fee estimation result.
 *
 * Design Decision: Returns bigint (not BigNumber) because:
 * 1. SDK functions return bigint for precision (64-bit integers)
 * 2. BigNumber constructor accepts bigint directly: `new BigNumber(bigintValue)`
 * 3. For large values, bigint preserves full precision without string conversion overhead
 *
 * Consumers should convert to BigNumber when needed:
 * ```typescript
 * const estimation = await estimateFees(...);
 * const fee = new BigNumber(estimation.cost.toString());  // bigint → string → BigNumber
 * ```
 *
 * Note: The string conversion is intentional for BigNumber precision safety.
 */
export interface FeeEstimation {
  cost: bigint;
  energy: bigint;
}

export async function estimateFees(
  currency: CryptoCurrency,
  transactionType: TransactionType = TransactionType.Transfer,
  memoSize?: number,
): Promise<FeeEstimation> {
  try {
    // numSignatures is typically 1 for standard accounts
    const numSignatures = 1;

    const result = await getTransactionCost(
      currency,
      numSignatures,
      memoSize === undefined ? undefined : { memoSize },
    );

    return {
      cost: BigInt(result.cost),
      energy: BigInt(result.energy),
    };
  } catch (error) {
    log("concordium", "estimateFees error", { error });

    return {
      cost: CONCORDIUM_ENERGY.DEFAULT_COST,
      energy: getDefaultEnergy(transactionType),
    };
  }
}
