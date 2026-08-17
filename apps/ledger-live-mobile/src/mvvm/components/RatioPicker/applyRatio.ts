import BigNumber from "bignumber.js";

/** `ratio` of `value`, rounded down to `decimalPlaces`. */
export function applyRatio(value: number, ratio: number, decimalPlaces: number): number {
  return BigNumber(value)
    .times(ratio)
    .decimalPlaces(decimalPlaces, BigNumber.ROUND_DOWN)
    .toNumber();
}
