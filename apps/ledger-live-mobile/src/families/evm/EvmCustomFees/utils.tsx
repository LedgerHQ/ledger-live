import BigNumber from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import { inferDynamicRange, Range } from "@ledgerhq/live-common/range";
import { GasOptions } from "@ledgerhq/coin-evm/lib/types";
import invariant from "invariant";

// This is 10 Gwei in wei. 20 Gwei is 2e8 or 20e9
// Should we rename the variable to TEN_GWEI or update the value to 20e9?
const TWENTY_GWEI = new BigNumber(10e9);

const defaultMaxPriorityFeeRange = inferDynamicRange(TWENTY_GWEI); // 0 - 20 Gwei
const defaultMaxFeePerGasRange = inferDynamicRange(TWENTY_GWEI); // 0 - 20 Gwei

export const inferMaxPriorityFeeRange = (gasOptions: GasOptions): Range => {
  if (!gasOptions) return defaultMaxPriorityFeeRange;

  invariant(
    gasOptions.slow.maxPriorityFeePerGas,
    "maxPriorityFeePerGas should be defined for slow gas options",
  );
  invariant(
    gasOptions.medium.maxPriorityFeePerGas,
    "maxPriorityFeePerGas should be defined for medium gas options",
  );
  invariant(
    gasOptions.fast.maxPriorityFeePerGas,
    "maxPriorityFeePerGas should be defined for fast gas options",
  );

  return inferDynamicRange(gasOptions.medium.maxPriorityFeePerGas, {
    minValue: getEnv("EIP1559_MINIMUM_FEES_GATE")
      ? gasOptions.slow.maxPriorityFeePerGas.times(getEnv("EIP1559_PRIORITY_FEE_LOWER_GATE"))
      : new BigNumber(0),
    maxValue: gasOptions.fast.maxPriorityFeePerGas,
  });
};

export const inferMaxFeeRange = (gasOptions: GasOptions): Range => {
  if (!gasOptions) return defaultMaxFeePerGasRange;

  invariant(
    gasOptions.medium.maxFeePerGas,
    "maxFeePerGas should be defined for medium gas options",
  );
  invariant(gasOptions.fast.maxFeePerGas, "maxFeePerGas should be defined for fast gas options");

  return inferDynamicRange(gasOptions.medium.maxFeePerGas, {
    minValue: new BigNumber(0),
    maxValue: gasOptions.fast.maxFeePerGas,
  });
};
