import { BigNumber } from "bignumber.js";

export type PnlTrend = "up" | "down" | "neutral";

export const trendFromSign = (value: BigNumber): PnlTrend => {
  if (value.isZero()) return "neutral";
  return value.isPositive() ? "up" : "down";
};
