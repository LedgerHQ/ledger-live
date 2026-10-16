import type { Account, FeeStrategy } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getFeeParameters, type Transaction } from "./types";

/** The network fee presets of the last estimation, slowest first. */
export const useFeesStrategy = (a: Account, t: Transaction): FeeStrategy[] => {
  const { feeRates } = getFeeParameters(t);
  if (!feeRates) return [];
  const unit = a.currency.units[a.currency.units.length - 1]; // Should be sat
  return (["slow", "medium", "fast"] as const).map(speed => ({
    label: speed,
    amount: new BigNumber(feeRates[speed]),
    unit,
  }));
};
