import type BigNumber from "bignumber.js";

export function pnlPercentage(pnl: BigNumber, basis: BigNumber): BigNumber | null {
  if (basis.isZero()) return null;
  return pnl.div(basis).times(100);
}
