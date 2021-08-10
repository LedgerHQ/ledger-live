import invariant from "invariant";
import type { NetworkInfo, Transaction } from "./types";
import type { FeeStrategy, Account } from "../../types";
export const useFeesStrategy = (a: Account, t: Transaction): FeeStrategy[] => {
  const networkInfo = t.networkInfo;
  invariant(networkInfo, "no network info");
  const strategies = (networkInfo as NetworkInfo).feeItems.items
    .map((feeItem) => {
      return {
        label: feeItem.speed,
        amount: feeItem.feePerByte,
        unit: a.currency.units[a.currency.units.length - 1], // Should be sat
      };
    })
    .reverse();
  return strategies;
};
