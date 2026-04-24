import { useEffect, useMemo, useState } from "react";
import { getValidators, getCachedValidators } from "@ledgerhq/coin-evm/staking/index";
import type { StakingValidatorItem } from "@ledgerhq/coin-evm/types/index";

export type EvmStakingValidatorsState = {
  validators: StakingValidatorItem[];
  loading: boolean;
  error: Error | null;
};

/**
 * Fetches the validator list for an EVM staking chain and filters/sorts it
 * for display in a selection UI (Name, Commission, Total Stake).
 *
 * - Filters out validators with a 100% commission (non-delegatable)
 * - Sorts by total staked tokens (descending)
 * - Applies a case-insensitive substring search on the validator name
 */
type FetchState = {
  items: StakingValidatorItem[];
  loading: boolean;
  error: Error | null;
};

export function useEvmStakingValidators(
  currencyId: string,
  searchInput?: string,
): EvmStakingValidatorsState {
  // Seed from the in-memory cache (populated by a previous mount or prefetch).
  // Single read avoids redundant work and inconsistent TTL boundary at init.
  const [fetchState, setFetchState] = useState<FetchState>(() => {
    const cached = getCachedValidators(currencyId);
    return { items: cached ?? [], loading: !cached, error: null };
  });

  useEffect(() => {
    // guards against stale resolutions when currencyId changes
    let cancelled = false;

    const cached = getCachedValidators(currencyId);
    setFetchState({ items: cached ?? [], loading: !cached, error: null });

    getValidators(currencyId)
      .then(items => {
        if (cancelled) return;
        setFetchState(s => ({ ...s, items }));
      })
      .catch(err => {
        if (cancelled) return;
        setFetchState(s => ({
          ...s,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      })
      .finally(() => {
        if (cancelled) return;
        setFetchState(s => ({ ...s, loading: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [currencyId]);

  const filtered = useMemo(() => {
    const query = searchInput?.toLowerCase().trim() ?? "";
    return fetchState.items
      .filter(v => {
        if (v.commission === 1) return false;
        if (!query) return true;
        return v.name.toLowerCase().includes(query);
      })
      .sort((a, b) => b.tokens - a.tokens);
  }, [fetchState.items, searchInput]);

  return {
    validators: filtered,
    loading: fetchState.loading,
    error: fetchState.error,
  };
}
