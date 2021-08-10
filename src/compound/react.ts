import { useMemo } from "react";
import { BigNumber } from "bignumber.js";
import type { AccountLikeArray, TokenAccount } from "../types";
import {
  getSupplyMax,
  isCompoundTokenSupported,
} from "../families/ethereum/modules/compound";
import type { CompoundAccountSummary } from "./types";
import { makeCompoundSummaryForAccount } from "./logic";
import { findCompoundToken } from "../currencies";
export function useSupplyMax(account: TokenAccount): BigNumber {
  return useMemo(() => getSupplyMax(account), [account]);
}
export const useSupplyMaxChoiceButtons = (
  supplyMax: BigNumber
): Array<{
  label: string;
  value: BigNumber;
}> => {
  return useMemo(
    () => [
      {
        label: "25%",
        value: supplyMax.multipliedBy(0.25).integerValue(),
      },
      {
        label: "50%",
        value: supplyMax.multipliedBy(0.5).integerValue(),
      },
      {
        label: "75%",
        value: supplyMax.multipliedBy(0.75).integerValue(),
      },
      {
        label: "100%",
        value: supplyMax,
      },
    ],
    [supplyMax]
  );
};

const makeSummaries = (accounts: AccountLikeArray): CompoundAccountSummary[] =>
  accounts
    .map((acc) => {
      if (acc.type !== "TokenAccount") return;
      const ctoken = findCompoundToken(acc.token);
      if (!ctoken) return;
      if (!isCompoundTokenSupported(ctoken)) return;
      const parentAccount = accounts.find((a) => a.id === acc.parentId);
      if (!parentAccount || parentAccount.type !== "Account") return;
      const summary = makeCompoundSummaryForAccount(acc, parentAccount);
      return summary;
    })
    .filter(Boolean) as CompoundAccountSummary[];

export function useCompoundSummaries(
  accounts: AccountLikeArray
): CompoundAccountSummary[] {
  const summaries = useMemo(() => makeSummaries(accounts), [accounts]);
  return summaries;
}
