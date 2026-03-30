import type { Transaction } from "@ledgerhq/coin-bitcoin/types";
import type { Account, FeeStrategy } from "@ledgerhq/types-live";

export const useFeesStrategy = (a: Account, t: Transaction): FeeStrategy[] => {
  const networkInfo = t.networkInfo;

  if (!networkInfo) return [];

  const strategies = networkInfo.feeItems.items
    .map(feeItem => {
      return {
        label: feeItem.speed,
        amount: feeItem.feePerByte,
        unit: a.currency.units[a.currency.units.length - 1], // Should be sat
      };
    })
    .reverse();
  return strategies;
};
