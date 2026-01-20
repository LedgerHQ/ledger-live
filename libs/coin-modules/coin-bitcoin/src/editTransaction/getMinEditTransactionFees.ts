import { BigNumber } from "bignumber.js";

/**
 * Returns the minimum fee rate to replace (RBF) a bitcoin transaction.
 * Rule of thumb: at least +10% and at least +1 sat/vB.
 *
 * Note: some nodes also enforce an *absolute* fee delta based on tx vsize
 * (incremental relay fee). If you have vsize available, you can enforce that too.
 */
export const getMinFees = ({
  feePerByte,
}: {
  feePerByte: BigNumber; // sat/vB (or sat/byte) depending on your model
}): { feePerByte: BigNumber } => {
  const factorBump = feePerByte.times(1.1);
  const oneSatBump = feePerByte.plus(1);

  const bumped = BigNumber.maximum(factorBump, oneSatBump).integerValue(BigNumber.ROUND_CEIL);

  return { feePerByte: bumped };
};
