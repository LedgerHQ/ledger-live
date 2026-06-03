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
 */
export function trendFromSign(value: BigNumber): PnlTrend {
  if (value.isZero()) return "neutral";
  return value.isPositive() ? "up" : "down";
}
