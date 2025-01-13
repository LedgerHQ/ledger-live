import type { Account, FeeStrategy } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/coin-kaspa/types/index";
import BigNumber from "bignumber.js";

export const useFeesStrategy = (a: Account, t: Transaction): FeeStrategy[] => {
  return [
    {
      label: "slow",
      amount: BigNumber(1),
      unit: a.currency.units[a.currency.units.length - 1], // Should be sat
    },
    {
      label: "medium",
      amount: BigNumber(2),
      unit: a.currency.units[a.currency.units.length - 1], // Should be sat
    },
    {
      label: "fast",
      amount: BigNumber(3),
      unit: a.currency.units[a.currency.units.length - 1], // Should be sat
    },
  ];
};
