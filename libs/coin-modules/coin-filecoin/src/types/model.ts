import type { FeeEstimation } from "@ledgerhq/coin-framework/api/index";

/**
 * FilecoinFeeEstimation extends FeeEstimation with gas parameters
 */
export interface FilecoinFeeEstimation extends FeeEstimation {
  parameters?: {
    gasFeeCap: bigint;
    gasPremium: bigint;
    gasLimit: bigint;
  };
}

/**
 * ListOperationsOptions for pagination
 */
export interface ListOperationsOptions {
  limit?: number | undefined;
  minHeight?: number | undefined;
  order?: "asc" | "desc" | undefined;
  token?: string | undefined;
}

/**
 * CraftTransactionInput for transaction crafting
 */
export interface CraftTransactionInput {
  sender: string;
  recipient: string;
  amount: bigint;
  nonce: number;
  gasFeeCap?: bigint | undefined;
  gasPremium?: bigint | undefined;
  gasLimit?: bigint | undefined;
  // Token transfer fields
  tokenContractAddress?: string | undefined;
}
