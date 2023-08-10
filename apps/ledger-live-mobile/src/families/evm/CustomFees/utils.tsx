import BigNumber from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import { inferDynamicRange, Range } from "@ledgerhq/live-common/range";
import { GasOptions, TransactionRaw } from "@ledgerhq/coin-evm/types/index";

const TWENTY_GWEI = new BigNumber(10e9);

const defaultMaxPriorityFeeRange = inferDynamicRange(TWENTY_GWEI); // 0 - 20 Gwei
const defaultMaxFeePerGasRange = inferDynamicRange(TWENTY_GWEI); // 0 - 20 Gwei

export const inferMaxPriorityFeeRange = (
  gasOptions: GasOptions,
  transactionRaw?: TransactionRaw,
): Range => {
  if (!transactionRaw?.maxPriorityFeePerGas || !gasOptions.medium.nextBaseFee) {
    return defaultMaxPriorityFeeRange;
  }

  let minValue =
    gasOptions.slow.maxPriorityFeePerGas && getEnv("EIP1559_MINIMUM_FEES_GATE")
      ? gasOptions.slow.maxPriorityFeePerGas.times(getEnv("EIP1559_PRIORITY_FEE_LOWER_GATE"))
      : new BigNumber(0);

  let maxValue = gasOptions.fast.maxPriorityFeePerGas || new BigNumber(0);

  if (transactionRaw?.maxPriorityFeePerGas) {
    const maxPriorityFeeGap: number = getEnv("EDIT_TX_EIP1559_FEE_GAP_SPEEDUP_FACTOR");
    const newMaxPriorityFeePerGas = new BigNumber(transactionRaw.maxPriorityFeePerGas).times(
      1 + maxPriorityFeeGap,
    );

    if (newMaxPriorityFeePerGas.isGreaterThan(new BigNumber(minValue))) {
      minValue = newMaxPriorityFeePerGas;
    }

    if (newMaxPriorityFeePerGas.isGreaterThan(new BigNumber(maxValue))) {
      maxValue = newMaxPriorityFeePerGas;
    }
  }

  console.log({ mm: gasOptions.medium.maxPriorityFeePerGas });
  return inferDynamicRange(gasOptions.medium.maxPriorityFeePerGas || new BigNumber(0), {
    minValue,
    maxValue,
  });
};

export const inferMaxFeeRange = (gasOptions: GasOptions): Range => {
  if (!gasOptions?.medium.nextBaseFee) {
    return defaultMaxFeePerGasRange;
  }

  const { maxPriorityFeePerGas, nextBaseFee } = gasOptions.medium;
  console.log({ nextBaseFee });

  // ensuring valid base fee for 6 blocks with a mutliplier of 2
  const amplifiedBaseFee = nextBaseFee.times(getEnv("EIP1559_BASE_FEE_MULTIPLIER")).integerValue();

  return inferDynamicRange(amplifiedBaseFee.plus(maxPriorityFeePerGas || 0), {
    minValue: new BigNumber(0),
    maxValue: amplifiedBaseFee.plus(maxPriorityFeePerGas || 0),
  });
};
