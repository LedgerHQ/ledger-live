import { BigNumber } from "bignumber.js";

export function formatFeeRate(amount: BigNumber | undefined): string {
  if (!amount?.isFinite() || amount?.isNaN()) return "";
  return amount.integerValue(BigNumber.ROUND_DOWN).toFixed(0);
}
