import { BigNumber } from "bignumber.js";

export function areAmountsEqual(a: BigNumber, b: BigNumber, tolerance: BigNumber): boolean {
  return a.minus(b).abs().lte(tolerance);
}
