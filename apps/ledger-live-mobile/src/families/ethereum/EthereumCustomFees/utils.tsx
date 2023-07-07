import BigNumber from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import { inferDynamicRange, Range } from "@ledgerhq/live-common/range";
import { Transaction, TransactionRaw } from "@ledgerhq/live-common/families/ethereum/types";

const TWENTY_GWEI = new BigNumber(10e9);

const defaultMaxPriorityFeeRange = inferDynamicRange(TWENTY_GWEI); // 0 - 20 Gwei
const defaultMaxFeePerGasRange = inferDynamicRange(TWENTY_GWEI); // 0 - 20 Gwei

export const inferMaxPriorityFeeRange = (
  networkInfo: Transaction["networkInfo"],
  transactionRaw?: TransactionRaw,
): Range => {
  if (!networkInfo?.maxPriorityFeePerGas || !networkInfo?.nextBaseFeePerGas) {
    return defaultMaxPriorityFeeRange;
  }

  let minValue = getEnv("EIP1559_MINIMUM_FEES_GATE")
    ? networkInfo.maxPriorityFeePerGas.min.times(getEnv("EIP1559_PRIORITY_FEE_LOWER_GATE"))
    : new BigNumber(0);

  let maxValue = networkInfo.maxPriorityFeePerGas.max;

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

  return inferDynamicRange(networkInfo.maxPriorityFeePerGas.initial, {
    minValue,
    maxValue,
  });
};

export const inferMaxFeeRange = (networkInfo: Transaction["networkInfo"]): Range => {
  if (!networkInfo?.maxPriorityFeePerGas || !networkInfo?.nextBaseFeePerGas) {
    return defaultMaxFeePerGasRange;
  }

  const { maxPriorityFeePerGas, nextBaseFeePerGas } = networkInfo;
  const amplifiedBaseFee = nextBaseFeePerGas
    .times(getEnv("EIP1559_BASE_FEE_MULTIPLIER"))
    .integerValue(); // ensuring valid base fee for 6 blocks with a mutliplier of 2

  return inferDynamicRange(amplifiedBaseFee.plus(maxPriorityFeePerGas.initial), {
    minValue: new BigNumber(0),
    maxValue: amplifiedBaseFee.plus(maxPriorityFeePerGas.max),
  });
};
