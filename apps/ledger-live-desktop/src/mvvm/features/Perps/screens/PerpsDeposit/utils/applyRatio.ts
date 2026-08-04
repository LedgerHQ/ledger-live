import BigNumber from "bignumber.js";

export function applyRatio(value: number, ratio: number): number {
  return BigNumber(value).times(ratio).decimalPlaces(6, BigNumber.ROUND_DOWN).toNumber();
}
