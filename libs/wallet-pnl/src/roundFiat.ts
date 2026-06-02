import { BigNumber } from "bignumber.js";

/**
 * Round a counter-value amount, expressed in the unit's smallest atom (e.g.
 * cents for USD), to a whole atom — the resolution at which it is displayed.
 *
 * PnL values keep sub-atom precision for accurate aggregation, but the
 * displayed amount and its trend indicator must agree at the precision the user
 * actually sees: `formatCurrencyUnit` rounds to the nearest atom, so an amount
 * that renders as `0.00` must read as `"neutral"`, never an up/down arrow.
 *
 * Rounding to the atom (rather than a fixed number of decimals) matches the
 * displayed precision for any counter value — fiat (2 decimals) as well as a
 * crypto counter value — and needs no magnitude.
 */
export function roundFiatAtoms(value: BigNumber): BigNumber {
  const rounded = value.integerValue(BigNumber.ROUND_HALF_UP);
  // `integerValue` keeps the sign of a negative residual ("-0"), which renders
  // as "-$0.00"; collapse it to a true zero so the amount shows "$0.00".
  return rounded.isZero() ? new BigNumber(0) : rounded;
}
