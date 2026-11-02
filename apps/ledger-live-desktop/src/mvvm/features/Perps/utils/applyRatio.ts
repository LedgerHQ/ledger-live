import BigNumber from "bignumber.js";

/** `ratio` of `value`, rounded down; MAX also subtracts `maxBuffer`, floored at 0. */
export function applyRatio(
  value: number,
  ratio: number,
  decimalPlaces: number,
  maxBuffer = 0,
): number {
  const amount = BigNumber(value).times(ratio);
  return BigNumber.max(ratio === 1 ? amount.minus(maxBuffer) : amount, 0)
    .decimalPlaces(decimalPlaces, BigNumber.ROUND_DOWN)
    .toNumber();
}
