import { useEffect, useMemo, useState } from "react";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type { Currency } from "@domain/entity-currency";
import type { Account, AccountLike, AssetsDistribution, TokenAccount } from "@ledgerhq/types-live";
import {
  assetsDistributionFromRankedGroups,
  rankAccountSnapshots,
  rankAccountSnapshotsOffJs,
  shouldRankAccountsOnJsThread,
  snapshotAccountsForRanking,
  type RankedCurrencyGroup,
} from "LLM/utils/rankAccountsWorklet";
import { useSelector } from "~/context/hooks";
import { accountsSelector } from "~/reducers/accounts";
import { blacklistedTokenIdsSelector, counterValueCurrencySelector } from "~/reducers/settings";

function collectAccountsById(
  accounts: Array<Account | TokenAccount | AccountLike>,
  includeSubAccounts: boolean,
): Map<string, AccountLike> {
  const byId = new Map<string, AccountLike>();
  for (const account of accounts) {
    byId.set(account.id, account);
    if (includeSubAccounts && account.type === "Account" && account.subAccounts) {
      for (const sub of account.subAccounts) {
        byId.set(sub.id, sub);
      }
    }
  }
  return byId;
}

function remapRankedAccounts(
  accounts: Array<Account | TokenAccount | AccountLike>,
  includeSubAccounts: boolean,
  excludedTokenIds: string[],
  rankedIds: string[],
): AccountLike[] {
  const byId = collectAccountsById(accounts, includeSubAccounts);
  if (rankedIds.length === 0) {
    const fallback: AccountLike[] = [];
    byId.forEach(account => {
      if (account.type === "TokenAccount" && excludedTokenIds.includes(account.token.id)) {
        return;
      }
      fallback.push(account);
    });
    return fallback;
  }
  const ranked: AccountLike[] = [];
  for (const id of rankedIds) {
    const account = byId.get(id);
    if (account) {
      ranked.push(account);
    }
  }
  return ranked;
}

export function useWorkletRankedAccounts(
  accounts: Array<Account | TokenAccount | AccountLike>,
  excludedTokenIds: string[],
  countervalueState: CounterValuesState,
  toCurrency: Currency,
  includeSubAccounts = true,
): { rankedAccounts: AccountLike[]; groups: RankedCurrencyGroup[] } {
  const snapshots = useMemo(
    () => snapshotAccountsForRanking(accounts, countervalueState, toCurrency, includeSubAccounts),
    [accounts, countervalueState, includeSubAccounts, toCurrency],
  );

  const [ranked, setRanked] = useState<{ ids: string[]; groups: RankedCurrencyGroup[] }>(() => {
    if (!shouldRankAccountsOnJsThread()) {
      return { ids: [], groups: [] };
    }
    const result = rankAccountSnapshots({ snapshots, excludedTokenIds });
    return { ids: result.ids, groups: result.groups };
  });

  useEffect(() => {
    const applyResult = (ids: string[], nextGroups: RankedCurrencyGroup[]) => {
      setRanked(current => {
        const sameIds =
          current.ids.length === ids.length && current.ids.every((id, index) => id === ids[index]);
        const sameGroups =
          current.groups.length === nextGroups.length &&
          current.groups.every(
            (group, index) =>
              group.currencyId === nextGroups[index].currencyId &&
              group.value === nextGroups[index].value &&
              group.ids.length === nextGroups[index].ids.length &&
              group.ids.every((id, idIndex) => id === nextGroups[index].ids[idIndex]),
          );
        if (sameIds && sameGroups) {
          return current;
        }
        return { ids, groups: nextGroups };
      });
    };

    if (shouldRankAccountsOnJsThread()) {
      const result = rankAccountSnapshots({ snapshots, excludedTokenIds });
      applyResult(result.ids, result.groups);
      return;
    }

    let cancelled = false;
    rankAccountSnapshotsOffJs({ snapshots, excludedTokenIds }).then(result => {
      if (!cancelled) {
        applyResult(result.ids, result.groups);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [snapshots, excludedTokenIds]);

  const rankedAccounts = useMemo(
    () => remapRankedAccounts(accounts, includeSubAccounts, excludedTokenIds, ranked.ids),
    [accounts, excludedTokenIds, includeSubAccounts, ranked.ids],
  );

  return { rankedAccounts, groups: ranked.groups };
}

export function useWorkletAssetsDistribution(opts: {
  showEmptyAccounts?: boolean;
  hideEmptyTokenAccount?: boolean;
  skip?: boolean;
}): AssetsDistribution & { isLoading: boolean } {
  const storeAccounts = useSelector(accountsSelector);
  const excludedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const countervalueState = useCountervaluesState();
  const toCurrency = useSelector(counterValueCurrencySelector);
  const { rankedAccounts, groups } = useWorkletRankedAccounts(
    opts.skip ? [] : storeAccounts,
    excludedTokenIds,
    countervalueState,
    toCurrency,
    true,
  );

  return useMemo(() => {
    const byId = new Map<string, AccountLike>();
    for (const account of rankedAccounts) {
      byId.set(account.id, account);
    }
    return {
      ...assetsDistributionFromRankedGroups(groups, byId, {
        showEmptyAccounts: opts.showEmptyAccounts,
        hideEmptyTokenAccount: opts.hideEmptyTokenAccount,
      }),
      isLoading: !opts.skip && groups.length === 0 && rankedAccounts.length > 0,
    };
  }, [groups, opts.hideEmptyTokenAccount, opts.showEmptyAccounts, opts.skip, rankedAccounts]);
}
