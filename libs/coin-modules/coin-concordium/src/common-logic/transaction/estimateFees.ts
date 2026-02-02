import {
  AccountTransactionPayload,
  AccountTransactionType,
  convertEnergyToMicroCcd,
  Energy,
  getEnergyCost,
} from "@ledgerhq/concordium-sdk-adapter";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CONCORDIUM_ENERGY } from "../../constants";
import { getBlockChainParameters } from "../../network/grpcClient";

/**
 * Returns the default fallback energy for a given transaction type.
 * Used when fee estimation fails (network error, rate limiting, etc.)
 * to ensure transactions have sufficient energy to be processed.
 */
function getDefaultEnergy(transactionType: AccountTransactionType): bigint {
  switch (transactionType) {
    case AccountTransactionType.TransferWithMemo:
      return CONCORDIUM_ENERGY.TRANSFER_WITH_MEMO_MAX;
    default:
      return CONCORDIUM_ENERGY.DEFAULT;
  }
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
  serializedTransaction: string,
  currency: CryptoCurrency,
  transactionType: AccountTransactionType = AccountTransactionType.Transfer,
  payload?: AccountTransactionPayload,
): Promise<FeeEstimation> {
  try {
    const chainParameters = await getBlockChainParameters(currency);

    let energy: Energy.Type;

    // For simple transfers without payload energy cost is fixed
    if (transactionType === AccountTransactionType.Transfer && !payload) {
      energy = Energy.create(CONCORDIUM_ENERGY.SIMPLE_TRANSFER);
    } else {
      // For other transaction types or transfers with payload, calculate energy cost
      if (!payload) {
        throw new Error("Payload is required for non-transfer transactions");
      }
      energy = getEnergyCost(transactionType, payload);
    }

    const costAmount = convertEnergyToMicroCcd(energy, chainParameters);

    return {
      cost: costAmount.microCcdAmount,
      energy: energy.value,
    };
  } catch (_e) {
    return {
      cost: CONCORDIUM_ENERGY.DEFAULT_COST,
      energy: getDefaultEnergy(transactionType),
    };
  }
}
