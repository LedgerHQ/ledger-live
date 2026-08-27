import { useEffect, useMemo, useState } from "react";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type { Currency } from "@domain/entity-currency";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import {
  rankAccountSnapshots,
  rankAccountSnapshotsOffJs,
  shouldRankAccountsOnJsThread,
  snapshotAccountsForRanking,
} from "LLM/utils/rankAccountsWorklet";

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

export function useWorkletRankedAccounts(
  accounts: Array<Account | TokenAccount | AccountLike>,
  excludedTokenIds: string[],
  countervalueState: CounterValuesState,
  toCurrency: Currency,
  includeSubAccounts = true,
): AccountLike[] {
  const snapshots = useMemo(
    () => snapshotAccountsForRanking(accounts, countervalueState, toCurrency, includeSubAccounts),
    [accounts, countervalueState, includeSubAccounts, toCurrency],
  );

  const [rankedIds, setRankedIds] = useState<string[]>(() => {
    if (!shouldRankAccountsOnJsThread()) {
      return [];
    }
    return rankAccountSnapshots({ snapshots, excludedTokenIds }).ids;
  });

  useEffect(() => {
    const applyIds = (ids: string[]) => {
      setRankedIds(current => {
        if (current.length === ids.length && current.every((id, index) => id === ids[index])) {
          return current;
        }
        return ids;
      });
    };

    if (shouldRankAccountsOnJsThread()) {
      applyIds(rankAccountSnapshots({ snapshots, excludedTokenIds }).ids);
      return;
    }

    let cancelled = false;
    rankAccountSnapshotsOffJs({ snapshots, excludedTokenIds }).then(result => {
      if (!cancelled) {
        applyIds(result.ids);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [snapshots, excludedTokenIds]);

  return useMemo(() => {
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
  }, [accounts, excludedTokenIds, includeSubAccounts, rankedIds]);
}
