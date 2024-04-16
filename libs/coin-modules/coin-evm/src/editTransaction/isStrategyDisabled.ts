import type { FeeData, Transaction } from "../types/index";
import { getMinFees } from "./getMinEditTransactionFees";

/**
 * A strategy is disabled if it's fees are lower than the minimum fees
 */
export const isStrategyDisabled = ({
  transaction,
  feeData,
}: {
  transaction: Transaction;
  feeData: FeeData;
}): boolean => {
  const minFees = getMinFees({ transaction });

  if (transaction.type === 2) {
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
