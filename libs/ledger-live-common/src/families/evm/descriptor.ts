import type { CoinDescriptor, CustomFeeInputDescriptor } from "../../bridge/descriptor";
import { BigNumber } from "bignumber.js";

const EVM_STRATEGIES = ["slow", "medium", "fast"] as const;

const GWEI_DIVISOR = new BigNumber(10).pow(9);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBigNumber(value: unknown): value is BigNumber {
  return BigNumber.isBigNumber(value);
}

function getEstimatedFeesForEvm(maxFee: BigNumber, gasLimit: BigNumber): BigNumber {
  return maxFee.times(gasLimit);
}

function getMaxFeeFromGasOption(maxFeePerGas: unknown, gasPrice: unknown): BigNumber {
  if (isBigNumber(maxFeePerGas)) {
    return maxFeePerGas;
  }
  if (isBigNumber(gasPrice)) {
    return gasPrice;
  }
  return new BigNumber(0);
}

function weiToGwei(wei: BigNumber): string {
  return wei.dividedBy(GWEI_DIVISOR).decimalPlaces(6, BigNumber.ROUND_DOWN).toFixed();
}

function gweiToWei(gwei: string): BigNumber {
  const val = new BigNumber(gwei);
  if (val.isNaN() || val.isNegative()) return new BigNumber(0);
  return val.times(GWEI_DIVISOR).integerValue(BigNumber.ROUND_DOWN);
}

/**
 * Determine whether the EVM transaction is EIP-1559 (type 2).
 * Falls back to checking gasOptions for maxFeePerGas presence.
 */
function isEip1559(transaction: Record<string, unknown>): boolean {
  if (transaction.type === 2) return true;
  // Check gasOptions for EIP-1559 fields
  const gasOptions = transaction.gasOptions;
  if (isRecord(gasOptions)) {
    const medium = gasOptions.medium;
    if (isRecord(medium) && isBigNumber(medium.maxFeePerGas)) return true;
  }
  return false;
}

function getSuggestedMaxFeeRange(transaction: Record<string, unknown>): {
  min: string;
  max: string;
} | null {
  const gasOptions = transaction.gasOptions;
  if (!isRecord(gasOptions)) return null;

  const slow = gasOptions.slow;
  const fast = gasOptions.fast;
  if (!isRecord(slow) || !isRecord(fast)) return null;

  const slowFee = getMaxFeeFromGasOption(slow.maxFeePerGas, slow.gasPrice);
  const fastFee = getMaxFeeFromGasOption(fast.maxFeePerGas, fast.gasPrice);
  if (slowFee.isZero() && fastFee.isZero()) return null;

  return {
    min: weiToGwei(slowFee),
    max: weiToGwei(fastFee),
  };
}

function getNextBlockPriorityFee(transaction: Record<string, unknown>): string | null {
  const gasOptions = transaction.gasOptions;
  if (!isRecord(gasOptions)) return null;

  const medium = gasOptions.medium;
  if (!isRecord(medium)) return null;

  const maxPriorityFeePerGas = medium.maxPriorityFeePerGas;
  if (!isBigNumber(maxPriorityFeePerGas)) return null;

  return `${weiToGwei(maxPriorityFeePerGas)} Gwei`;
}

/** Custom fee input descriptors for EIP-1559 transactions */
const eip1559Inputs: readonly CustomFeeInputDescriptor[] = [
  {
    key: "maxFeePerGas",
    type: "number",
    unitLabel: "Gwei",
    suggestedRange: {
      getRange: transaction => {
        if (!isRecord(transaction)) return null;
        return getSuggestedMaxFeeRange(transaction);
      },
    },
  },
  {
    key: "maxPriorityFeePerGas",
    type: "number",
    unitLabel: "Gwei",
    helperInfo: {
      getValue: transaction => {
        if (!isRecord(transaction)) return null;
        return getNextBlockPriorityFee(transaction);
      },
    },
  },
  {
    key: "gasLimit",
    type: "number",
    unitLabel: "Gwei",
  },
];

export const descriptor: CoinDescriptor = {
  send: {
    inputs: {
      recipientSupportsDomain: true,
    },
    fees: {
      hasPresets: true,
      hasCustom: true,
      presets: {
        getOptions: transaction => {
          if (!isRecord(transaction)) {
            return [];
          }

          const gasLimit = transaction.gasLimit;
          const gasOptions = transaction.gasOptions;

          if (!isBigNumber(gasLimit) || !isRecord(gasOptions)) {
            return [];
          }

          const options: { id: string; amount: BigNumber; estimatedMs?: number }[] = [];

          for (const strategy of EVM_STRATEGIES) {
            const gasOption = gasOptions[strategy];
            if (!isRecord(gasOption)) {
              continue;
            }

            const maxFeePerGas = gasOption.maxFeePerGas;
            const gasPrice = gasOption.gasPrice;

            const maxFee = getMaxFeeFromGasOption(maxFeePerGas, gasPrice);
            const estimatedFees = getEstimatedFeesForEvm(maxFee, gasLimit);

            const getEstimatedMs = (strategyType: string): number => {
              if (strategyType === "slow") return 2 * 60 * 1000;
              if (strategyType === "medium") return 30 * 1000;
              return 15 * 1000;
            };

            options.push({
              id: strategy,
              amount: estimatedFees,
              estimatedMs: getEstimatedMs(strategy),
            });
          }

          return options;
        },
      },
      custom: {
        inputs: eip1559Inputs,
        getInitialValues: (transaction): Record<string, string> => {
          const empty: Record<string, string> = {};
          if (!isRecord(transaction)) return empty;

          const is1559 = isEip1559(transaction);
          const gasLimit = transaction.gasLimit;

          if (is1559) {
            // Try to get from transaction first (if custom values were set)
            const maxFeePerGas = transaction.maxFeePerGas;
            const maxPriorityFeePerGas = transaction.maxPriorityFeePerGas;

            if (isBigNumber(maxFeePerGas) && isBigNumber(maxPriorityFeePerGas)) {
              return {
                maxFeePerGas: weiToGwei(maxFeePerGas),
                maxPriorityFeePerGas: weiToGwei(maxPriorityFeePerGas),
                gasLimit: isBigNumber(gasLimit) ? gasLimit.toFixed() : "",
              };
            }

            // Otherwise, fallback to medium preset from gasOptions
            const gasOptions = transaction.gasOptions;
            if (isRecord(gasOptions)) {
              const medium = gasOptions.medium;
              if (isRecord(medium)) {
                const mediumMaxFee = medium.maxFeePerGas;
                const mediumPriorityFee = medium.maxPriorityFeePerGas;
                return {
                  maxFeePerGas: isBigNumber(mediumMaxFee) ? weiToGwei(mediumMaxFee) : "",
                  maxPriorityFeePerGas: isBigNumber(mediumPriorityFee)
                    ? weiToGwei(mediumPriorityFee)
                    : "",
                  gasLimit: isBigNumber(gasLimit) ? gasLimit.toFixed() : "",
                };
              }
            }

            return {
              maxFeePerGas: "",
              maxPriorityFeePerGas: "",
              gasLimit: isBigNumber(gasLimit) ? gasLimit.toFixed() : "",
            };
          }

          // Legacy transaction
          const gasPrice = transaction.gasPrice;

          // Try preset if no gasPrice
          const gasOptions = transaction.gasOptions;
          const medium = isRecord(gasOptions) ? gasOptions.medium : undefined;
          if (!isBigNumber(gasPrice) && isRecord(gasOptions) && isRecord(medium)) {
            const mediumGasPrice = medium.gasPrice;
            return {
              gasPrice: isBigNumber(mediumGasPrice) ? weiToGwei(mediumGasPrice) : "",
              gasLimit: isBigNumber(gasLimit) ? gasLimit.toFixed() : "",
            };
          }

          return {
            gasPrice: isBigNumber(gasPrice) ? weiToGwei(gasPrice) : "",
            gasLimit: isBigNumber(gasLimit) ? gasLimit.toFixed() : "",
          };
        },
        buildTransactionPatch: values => {
          const patch: Record<string, unknown> = {
            feesStrategy: "custom",
          };

          if ("maxFeePerGas" in values) {
            patch.maxFeePerGas = gweiToWei(values.maxFeePerGas);
          }
          if ("maxPriorityFeePerGas" in values) {
            patch.maxPriorityFeePerGas = gweiToWei(values.maxPriorityFeePerGas);
          }
          if ("gasPrice" in values) {
            patch.gasPrice = gweiToWei(values.gasPrice);
          }
          if ("gasLimit" in values) {
            const limit = new BigNumber(values.gasLimit);
            patch.customGasLimit =
              limit.isNaN() || limit.isNegative()
                ? new BigNumber(0)
                : limit.integerValue(BigNumber.ROUND_DOWN);
          }

          return patch;
        },
      },
    },
    amount: {
      getPlugins: () => ["evmGasOptionsSync"],
    },
    selfTransfer: "free",
    errors: {
      userRefusedTransaction: "UserRefusedOnDevice",
    },
  },
};
