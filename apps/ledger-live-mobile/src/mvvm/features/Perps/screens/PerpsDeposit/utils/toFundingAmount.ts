import BigNumber from "bignumber.js";

/**
 * Converts an amount typed in the counter value currency into the funding currency,
 * by taking the same share of the account balance. Returns a plain decimal string,
 * which is the format the review step parses.
 */
export function toFundingAmount(params: {
  counterValueAmount: number;
  maxCounterValueAmount: number;
  spendableBalance: BigNumber;
  magnitude: number;
}): string {
  const { counterValueAmount, maxCounterValueAmount, spendableBalance, magnitude } = params;
  if (maxCounterValueAmount <= 0) return "0";

  return spendableBalance
    .times(BigNumber(counterValueAmount).div(maxCounterValueAmount))
    .integerValue(BigNumber.ROUND_FLOOR)
    .shiftedBy(-magnitude)
    .toFixed();
}
