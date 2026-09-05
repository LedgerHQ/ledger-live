import BigNumber from "bignumber.js";

/** `atomicAmount` shifted down by `magnitude`, as a plain decimal string. */
export function toAmountValue(atomicAmount: BigNumber, magnitude: number): string {
  return atomicAmount.shiftedBy(-magnitude).toFixed();
}
