import type { BigNumber } from "bignumber.js";
import { getMinFees } from "./getMinEditTransactionFees";

/**
 * A strategy is disabled if its fee rate is lower than the minimum fee rate
 * required to replace the original transaction (RBF bump).
 */
export const isStrategyDisabled = ({
  transaction,
  feesStrategy,
}: {
  transaction: { feePerByte?: BigNumber | null; rbf?: boolean };
  feesStrategy: BigNumber;
}): boolean => {
  // If RBF is explicitly disabled or the original fee rate is unknown, a replacement tx shouldn't be possible.
  if (!transaction.rbf || !transaction.feePerByte || !feesStrategy || feesStrategy.lte(0)) {
    return true;
  }

  const minFees = getMinFees({ feePerByte: transaction.feePerByte });
  return feesStrategy.isLessThan(minFees.feePerByte);
};
