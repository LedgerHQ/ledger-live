import type { BigNumber } from "bignumber.js";

/**
 * The trend direction implied by a signed PnL value.
 *
 * - `"up"`: value > 0 (profit)
 * - `"down"`: value < 0 (loss)
 * - `"neutral"`: value === 0 (no change)
 */
export type PnlTrend = "up" | "down" | "neutral";

/**
 * Maps a signed PnL value to its trend direction. UI-agnostic — apps map the
 * returned trend to their own icon / color tokens.
 *
 * Callers should pass a value already rounded to the displayed precision (see
 * `roundFiatAtoms`) so the trend agrees with what the user sees: an amount that
 * renders as `0.00` must read as `"neutral"`, not as an up/down arrow.
 */
export function trendFromSign(value: BigNumber): PnlTrend {
  if (value.isZero()) return "neutral";
  return value.isPositive() ? "up" : "down";
}
