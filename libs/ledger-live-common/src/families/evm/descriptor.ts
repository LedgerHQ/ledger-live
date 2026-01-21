import type { CoinDescriptor } from "../../bridge/descriptor";
import { BigNumber } from "bignumber.js";

const EVM_STRATEGIES = ["slow", "medium", "fast"] as const;

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
