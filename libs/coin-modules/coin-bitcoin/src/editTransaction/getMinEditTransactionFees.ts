import { BigNumber } from "bignumber.js";

/**
 * Returns the minimum fee rate to replace (RBF) a bitcoin transaction.
 * Rule of thumb: at least +10% and at least +1 sat/vB.
 */
export const getMinFees = ({
  feePerByte,
}: {
  feePerByte: BigNumber;
}): { feePerByte: BigNumber } => {
  const factorBump = feePerByte.times(1.1);
  const oneSatBump = feePerByte.plus(1);

  const bumped = BigNumber.maximum(factorBump, oneSatBump).integerValue(BigNumber.ROUND_CEIL);

  return { feePerByte: bumped };
};
