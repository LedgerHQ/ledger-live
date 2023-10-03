import type { FeeData } from "@ledgerhq/coin-evm/types/index";
import { BigNumber } from "bignumber.js";

// TODO: could use getMinFees directly and note rely on `minFees` props

/**
 * A strategy is disabled if the current fees are lower than the minimum fees
 */
export const isStrategyDisabled = ({
  isEIP1559,
  feeData,
  minFees,
}: {
  isEIP1559: boolean;
  feeData: FeeData;
  minFees?: {
    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
    gasPrice?: BigNumber;
  };
}): boolean => {
  if (!minFees) {
    return false;
  }

  if (isEIP1559) {
    if (
      !feeData.maxFeePerGas ||
      !feeData.maxPriorityFeePerGas ||
      !minFees.maxFeePerGas ||
      !minFees.maxPriorityFeePerGas
    ) {
      return false;
    }

    return (
      feeData.maxFeePerGas.isLessThan(minFees.maxFeePerGas) ||
      feeData.maxPriorityFeePerGas.isLessThan(minFees.maxPriorityFeePerGas)
    );
  } else {
    if (!feeData.gasPrice || !minFees.gasPrice) {
      return false;
    }

    return feeData.gasPrice.isLessThan(minFees.gasPrice);
  }
};
