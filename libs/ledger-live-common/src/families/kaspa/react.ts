import type { Account, FeeStrategy } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/coin-kaspa/types/index";
import { BigNumber } from "bignumber.js";

export const useFeesStrategy = (a: Account, t: Transaction): FeeStrategy[] => {
  const allSameEstimatedSeconds: boolean = t.networkInfo.every(
    ni => ni.estimatedSeconds === t.networkInfo[0].estimatedSeconds,
  );

  return t.networkInfo.map(ni => ({
    label: ni.label,
    amount: ni.amount,
    disabled: (ni.label === "slow" || ni.label === "medium") && allSameEstimatedSeconds,
    extra: {
      estimatedMs: BigNumber(ni.estimatedSeconds * 1000),
    },
    unit: a.currency.units[a.currency.units.length - 1], // Should be sat
  }));
};
