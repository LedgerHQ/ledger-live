import type {
  FeeEstimation,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { GAS, GAS_PRICE, MIN_GAS_LIMIT } from "../../constants";

/**
 * Estimate fees for a MultiversX transaction intent.
 *
 * Gas limits per mode:
 *   - native transfer: MIN_GAS_LIMIT (50,000)
 *   - ESDT transfer: 500,000
 *   - delegate / reDelegateRewards / unDelegate / withdraw: 75,000,000
 *   - claimRewards: 6,000,000
 */
export async function estimateFees(
  intent: TransactionIntent | StakingTransactionIntent,
  customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  if (customFeesParameters?.gasLimit !== undefined && customFeesParameters.gasLimit !== null) {
    // gasLimit is typed `unknown` (FeeEstimation.parameters: Record<string, unknown>).
    // Convert via String() so both number and bigint work without a type assertion,
    // and an invalid value throws instead of being silently coerced.
    const gasLimit = BigInt(String(customFeesParameters.gasLimit));
    return {
      value: gasLimit * BigInt(GAS_PRICE),
      parameters: customFeesParameters,
    };
  }

  const txType = (intent as StakingTransactionIntent).type ?? "";
  const assetType = intent.asset.type;

  let gasLimit: number;

  if (
    txType === "delegate" ||
    txType === "stake.createAccount" ||
    txType === "reDelegateRewards" ||
    txType === "unDelegate" ||
    txType === "stake.undelegate" ||
    txType === "withdraw" ||
    txType === "stake.withdraw"
  ) {
    gasLimit = GAS.DELEGATE;
  } else if (txType === "claimRewards") {
    gasLimit = GAS.CLAIM;
  } else if (assetType === "esdt") {
    gasLimit = GAS.ESDT_TRANSFER;
  } else {
    gasLimit = MIN_GAS_LIMIT;
  }

  return {
    value: BigInt(gasLimit) * BigInt(GAS_PRICE),
    parameters: { gasLimit },
  };
}
