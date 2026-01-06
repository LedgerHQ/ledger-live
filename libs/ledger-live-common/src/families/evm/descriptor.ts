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

            const maxFee = isBigNumber(maxFeePerGas)
              ? maxFeePerGas
              : isBigNumber(gasPrice)
                ? gasPrice
                : new BigNumber(0);
            const estimatedFees = getEstimatedFeesForEvm(maxFee, gasLimit);

            options.push({
              id: strategy,
              amount: estimatedFees,
              estimatedMs:
                strategy === "slow"
                  ? 2 * 60 * 1000
                  : strategy === "medium"
                    ? 30 * 1000
                    : 15 * 1000,
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
