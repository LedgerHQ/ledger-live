import type { BigNumber } from "bignumber.js";
import { getMinFees } from "./getMinEditTransactionFees";

/**
 * A strategy is disabled if its fee rate is lower than the minimum fee rate
 * required to replace the original transaction (RBF bump).
 */
export const isStrategyDisabled = ({
  transaction,
  feeData,
}: {
  transaction: { feePerByte: BigNumber; rbf?: boolean };
  feeData: { feePerByte?: BigNumber };
}): boolean => {
  // If RBF is explicitly disabled, a replacement tx shouldn't be possible.
  if (transaction.rbf === false) {
    return true;
  }

  const minFees = getMinFees({ feePerByte: transaction.feePerByte });

  // If the strategy doesn't provide a fee rate, don't disable it here.
  if (!feeData.feePerByte) {
    return false;
  }

  return feeData.feePerByte.isLessThan(minFees.feePerByte);
};
