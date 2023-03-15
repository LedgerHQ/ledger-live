import BigNumber from "bignumber.js";
import { getEnv } from "@ledgerhq/live-common/env";
import { inferDynamicRange, Range } from "@ledgerhq/live-common/range";
import { Transaction } from "@ledgerhq/live-common/families/ethereum/types";

const TWENTY_GWEI = new BigNumber(10e9);

const defaultMaxPriorityFeeRange = inferDynamicRange(TWENTY_GWEI); // 0 - 20 Gwei
const defaultMaxFeePerGasRange = inferDynamicRange(TWENTY_GWEI); // 0 - 20 Gwei

export const inferMaxPriorityFeeRange = (
  networkInfo: Transaction["networkInfo"],
): Range => {
  if (!networkInfo?.maxPriorityFeePerGas || !networkInfo?.nextBaseFeePerGas)
    return defaultMaxPriorityFeeRange;

  return inferDynamicRange(networkInfo.maxPriorityFeePerGas.initial, {
    minValue: getEnv("EIP1559_MINIMUM_FEES_GATE")
      ? networkInfo.maxPriorityFeePerGas.min.times(
          getEnv("EIP1559_PRIORITY_FEE_LOWER_GATE"),
        )
      : new BigNumber(0),
    maxValue: networkInfo.maxPriorityFeePerGas.max,
  });
};

export const inferMaxFeeRange = (
  networkInfo: Transaction["networkInfo"],
): Range => {
  if (!networkInfo?.maxPriorityFeePerGas || !networkInfo?.nextBaseFeePerGas)
    return defaultMaxFeePerGasRange;

  const { maxPriorityFeePerGas, nextBaseFeePerGas } = networkInfo;
  const amplifiedBaseFee = nextBaseFeePerGas.times(2); // ensuring 6 blocks of base fee

  return inferDynamicRange(
    amplifiedBaseFee.plus(maxPriorityFeePerGas.initial),
    {
      minValue: new BigNumber(0),
      maxValue: amplifiedBaseFee.plus(maxPriorityFeePerGas.max),
    },
  );
};
