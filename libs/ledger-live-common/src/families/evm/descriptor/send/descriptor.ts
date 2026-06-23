import { BigNumber } from "bignumber.js";
import type { SendDescriptor } from "../../../../bridge/descriptor/types";
import { evmCustomFeeConfig, isBigNumber, isRecord } from "./fees";

const EVM_STRATEGIES = ["slow", "medium", "fast"] as const;

function getMaxFeeFromGasOption(maxFeePerGas: unknown, gasPrice: unknown): BigNumber {
  if (isBigNumber(maxFeePerGas)) {
    return maxFeePerGas;
  }
  if (isBigNumber(gasPrice)) {
    return gasPrice;
  }
  return new BigNumber(0);
}

function getEstimatedMs(strategy: string): number {
  if (strategy === "slow") return 2 * 60 * 1000;
  if (strategy === "medium") return 30 * 1000;
  return 15 * 1000;
}

export const evmSendDescriptor: SendDescriptor = {
  inputs: {
    recipientSupportsDomain: true,
  },
  fees: {
    hasPresets: true,
    hasCustom: true,
    presets: {
      estimation: {
        fallbackPresetIds: EVM_STRATEGIES,
        allowZeroAmount: true,
      },
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
          const estimatedFees = maxFee.times(gasLimit);

          options.push({
            id: strategy,
            amount: estimatedFees,
            estimatedMs: getEstimatedMs(strategy),
          });
        }

        return options;
      },
    },
    custom: evmCustomFeeConfig,
  },
  amount: {
    getPlugins: () => ["evmGasOptionsSync"],
  },
  selfTransfer: "free",
  errors: {
    userRefusedTransaction: "UserRefusedOnDevice",
  },
};
