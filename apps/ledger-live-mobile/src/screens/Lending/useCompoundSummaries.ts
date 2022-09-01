import { useMemo } from "react";
import type { AccountLikeArray } from "@ledgerhq/types-live";
import type { CompoundAccountSummary } from "@ledgerhq/live-common/compound/types";
import { makeCompoundSummaryForAccount } from "@ledgerhq/live-common/compound/logic";
import { findCompoundToken } from "@ledgerhq/live-common/currencies/index";
import { isCompoundTokenSupported } from "@ledgerhq/live-common/families/ethereum/modules/compound";

const makeSummaries = (accounts: AccountLikeArray): CompoundAccountSummary[] =>
  accounts
    .map(acc => {
      if (acc.type !== "TokenAccount") return null;
      const ctoken = findCompoundToken(acc.token);
      if (!ctoken) return null;
      if (!isCompoundTokenSupported(ctoken)) return null;
      const parentAccount = accounts.find(a => a.id === acc.parentId);
      if (!parentAccount || parentAccount.type !== "Account") return null;
      const summary = makeCompoundSummaryForAccount(acc, parentAccount);
      return summary;
    })
    .filter(Boolean) as CompoundAccountSummary[];

export function useCompoundSummaries(
  accounts: AccountLikeArray,
): CompoundAccountSummary[] {
  return useMemo(() => makeSummaries(accounts), [accounts]);
}
