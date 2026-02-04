import type {
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
  TxDataNotSupported,
} from "@ledgerhq/coin-framework/api/types";
import { isSendTransactionIntent } from "@ledgerhq/coin-framework/utils";

import { GAS, GAS_PRICE, MIN_GAS_LIMIT } from "../constants";

/**
 * Estimates fees for a transaction intent based on transaction type and gas parameters.
 *
 * Gas limit selection logic:
 * - ESDT token transfers: GAS.ESDT_TRANSFER (500,000)
 * - Delegation operations (delegate/unDelegate): GAS.DELEGATE (75,000,000)
 * - Claim rewards operations: GAS.CLAIM (6,000,000)
 * - Native EGLD transfers: MIN_GAS_LIMIT (50,000)
 *
 * Note: Per AC4, this function should use current network gas price. The network gas price
 * should be fetched by the API layer and passed via networkGasPrice parameter. If not provided,
 * falls back to GAS_PRICE constant.
 *
 * @param intent - The transaction intent to estimate fees for. Must have valid intentType ("transaction" or "staking") and type (string) fields.
 * @param customFeesParameters - Optional custom fee parameters. Both gasLimit and gasPrice must be positive bigints, numbers, or strings. Cannot be zero or negative.
 * @param networkGasPrice - Optional current network gas price from network config (AC4 requirement). Must be positive bigint.
 * @returns FeeEstimation with total fee value and gas parameters (gasLimit, gasPrice)
 * @throws {Error} If intent is null, undefined, or missing required fields (intentType, type, asset for transaction intents)
 * @throws {Error} If intentType is not "transaction" or "staking"
 * @throws {Error} If intent.type is not a string
 * @throws {Error} If custom fee parameters are invalid (negative, zero, wrong types, or exceed reasonable bounds)
 * @throws {Error} If calculated fee exceeds maximum reasonable value (1000 EGLD)
 * @throws {Error} If staking type is unknown/unsupported
 *
 * @example
 * ```typescript
 * // Native EGLD transfer
 * const fees = estimateFees({
 *   intentType: "transaction",
 *   type: "send",
 *   sender: "erd1...",
 *   recipient: "erd1...",
 *   amount: 1000000000000000000n,
 *   asset: { type: "native" }
 * });
 *
 * // With custom gas price
 * const fees = estimateFees(intent, { gasPrice: 2000000000n });
 *
 * // With network gas price (from API)
 * const fees = estimateFees(intent, undefined, networkGasPrice);
 * ```
 */
export function estimateFees(
  intent: TransactionIntent<MemoNotSupported, TxDataNotSupported>,
  customFeesParameters?: FeeEstimation["parameters"],
  networkGasPrice?: bigint,
): FeeEstimation {
  // Input validation
  if (!intent) {
    throw new Error("estimateFees failed: intent is required");
  }

  if (!intent.intentType) {
    throw new Error("estimateFees failed: intent.intentType is required");
  }

  // Validate intentType is valid
  if (intent.intentType !== "transaction" && intent.intentType !== "staking") {
    throw new Error(
      `estimateFees failed: invalid intentType "${intent.intentType}". Expected "transaction" or "staking"`,
    );
  }

  if (!intent.type) {
    throw new Error("estimateFees failed: intent.type is required");
  }

  // Validate intent.type is a string (required for toLowerCase() call)
  if (typeof intent.type !== "string") {
    throw new Error(
      `estimateFees failed: intent.type must be a string, got ${typeof intent.type}`,
    );
  }

  // Validate asset exists for non-staking intents
  if (intent.intentType !== "staking" && !intent.asset) {
    throw new Error("estimateFees failed: intent.asset is required for transaction intents");
  }

  // Validate custom fee parameters if provided
  if (customFeesParameters) {
    if (customFeesParameters.gasPrice !== undefined) {
      const gasPriceValue = customFeesParameters.gasPrice;
      if (typeof gasPriceValue !== "bigint" && typeof gasPriceValue !== "number" && typeof gasPriceValue !== "string") {
        throw new Error("estimateFees failed: customFeesParameters.gasPrice must be bigint, number, or string");
      }
      const gasPriceBigInt = typeof gasPriceValue === "bigint" ? gasPriceValue : BigInt(gasPriceValue);
      if (gasPriceBigInt < 0n) {
        throw new Error("estimateFees failed: customFeesParameters.gasPrice cannot be negative");
      }
      if (gasPriceBigInt === 0n) {
        throw new Error("estimateFees failed: customFeesParameters.gasPrice cannot be zero");
      }
    }

    if (customFeesParameters.gasLimit !== undefined) {
      const gasLimitValue = customFeesParameters.gasLimit;
      if (typeof gasLimitValue !== "bigint" && typeof gasLimitValue !== "number" && typeof gasLimitValue !== "string") {
        throw new Error("estimateFees failed: customFeesParameters.gasLimit must be bigint, number, or string");
      }
      const gasLimitBigInt = typeof gasLimitValue === "bigint" ? gasLimitValue : BigInt(gasLimitValue);
      if (gasLimitBigInt < 0n) {
        throw new Error("estimateFees failed: customFeesParameters.gasLimit cannot be negative");
      }
      if (gasLimitBigInt === 0n) {
        throw new Error("estimateFees failed: customFeesParameters.gasLimit cannot be zero");
      }
    }
  }

  // Determine if this is a staking intent
  const isStakingIntent = intent.intentType === "staking";

  // Determine if this is an ESDT transfer (only for send intents)
  const isEsdtTransfer =
    !isStakingIntent && isSendTransactionIntent(intent) && intent.asset && intent.asset.type === "esdt";

  // Determine gas limit based on transaction type
  let gasLimit: bigint;

  if (isEsdtTransfer) {
    // ESDT token transfers
    gasLimit = BigInt(GAS.ESDT_TRANSFER);
  } else if (isStakingIntent) {
    // Staking operations
    const stakingType = intent.type.toLowerCase();
    if (stakingType === "delegate" || stakingType === "undelegate") {
      gasLimit = BigInt(GAS.DELEGATE);
    } else if (
      stakingType === "claimrewards" ||
      stakingType === "claim_rewards" ||
      stakingType === "withdraw" ||
      stakingType === "redelegaterewards" ||
      stakingType === "redelegate_rewards"
    ) {
      gasLimit = BigInt(GAS.CLAIM);
    } else {
      // Unknown staking type - this is likely a configuration error
      throw new Error(
        `estimateFees failed: unknown staking type "${stakingType}". Supported types: delegate, undelegate, claimRewards, claim_rewards, withdraw, reDelegateRewards, redelegate_rewards`,
      );
    }
  } else {
    // Native EGLD transfer
    gasLimit = BigInt(MIN_GAS_LIMIT);
  }

  // Determine gas price: custom > network > default constant
  // Priority: customFeesParameters.gasPrice > networkGasPrice > GAS_PRICE constant
  let gasPrice: bigint;
  if (customFeesParameters?.gasPrice !== undefined) {
    const gasPriceValue = customFeesParameters.gasPrice;
    gasPrice =
      typeof gasPriceValue === "bigint"
        ? gasPriceValue
        : BigInt(typeof gasPriceValue === "number" ? gasPriceValue : gasPriceValue);
  } else if (networkGasPrice !== undefined) {
    // Use network gas price (AC4 requirement)
    gasPrice = networkGasPrice;
  } else {
    // Fallback to constant (should not happen in production if API layer fetches network config)
    gasPrice = BigInt(GAS_PRICE);
  }

  // Use custom gas limit if provided, otherwise use calculated
  const finalGasLimit =
    customFeesParameters?.gasLimit !== undefined
      ? typeof customFeesParameters.gasLimit === "bigint"
        ? customFeesParameters.gasLimit
        : BigInt(
            typeof customFeesParameters.gasLimit === "number"
              ? customFeesParameters.gasLimit
              : customFeesParameters.gasLimit,
          )
      : gasLimit;

  // Calculate total fee
  const fee = finalGasLimit * gasPrice;

  // Validate fee is within reasonable bounds (prevent extremely large values)
  // Maximum reasonable fee: 1000 EGLD (1e21 smallest units)
  const MAX_REASONABLE_FEE = BigInt("1000000000000000000000");
  if (fee > MAX_REASONABLE_FEE) {
    throw new Error(
      `estimateFees failed: calculated fee (${fee}) exceeds maximum reasonable value (${MAX_REASONABLE_FEE}). Please check gas parameters.`,
    );
  }

  return {
    value: fee,
    parameters: {
      gasLimit: finalGasLimit,
      gasPrice: gasPrice,
    },
  };
}
