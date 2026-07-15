import BigNumber from "bignumber.js";

/**
 * Apply a safety multiplier to a provider-reported gas limit, with a
 * defensive fallback to a hard-coded default. Ported verbatim from the
 * swap-live-app `executeSwap` helper so DEX execution gives the same
 * gas headroom on both surfaces.
 */
export const getAdjustedGasLimit = (
  gasLimit: number | string | null | undefined,
  multiplier: number,
  defaultGasLimit: string,
): string => {
  if (gasLimit === undefined || gasLimit === null) {
    return defaultGasLimit;
  }

  const baseGasLimit = new BigNumber(gasLimit);
  if (baseGasLimit.isNaN() || baseGasLimit.isZero()) {
    return defaultGasLimit;
  }

  const safeMultiplier = !Number.isFinite(multiplier) || multiplier <= 0 ? 1 : multiplier;

  return baseGasLimit.times(safeMultiplier).integerValue(BigNumber.ROUND_CEIL).toString();
};
