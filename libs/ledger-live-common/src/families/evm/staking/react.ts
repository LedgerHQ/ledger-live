import { useEffect, useMemo, useState } from "react";
import { getValidators, mapDelegations } from "@ledgerhq/coin-evm/staking/index";
import type { Cursor } from "@ledgerhq/coin-module-framework/api/index";
import type { StakingValidatorItem } from "@ledgerhq/types-live";
import { sortLedgerValidatorFirst } from "./ledgerValidator";
import type { StakingAccount, StakingMappedDelegation } from "./types";
import { getAccountCurrency } from "../../../account";
import { GenericTransaction } from "../../../bridge/generic-coin-framework/types";
import { Unit } from "@ledgerhq/types-cryptoassets";

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
  const [fetchState, setFetchState] = useState<FetchState>({
    items: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    // guards against stale resolutions when currencyId changes
    let cancelled = false;

    setFetchState({ items: [], loading: true, error: null });

    // Walk every page before surfacing results. The list is reordered (Ledger-first)
    // and a validator is selected by default, so emitting partial pages would let the
    // list and the default selection reshuffle as later pages arrive.
    const getAllValidators = async () => {
      try {
        const items: StakingValidatorItem[] = [];
        let cursor: Cursor | undefined;

        do {
          const result = await getValidators(currencyId, cursor);
          if (cancelled) return;

          items.push(...result.items);
          cursor = result.next;
        } while (typeof cursor === "string");

        if (cancelled) return;
        setFetchState({ items, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        setFetchState(s => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      }
    };

    void getAllValidators();

    return () => {
      cancelled = true;
    };
  }, [currencyId]);

  const filtered = useMemo(() => {
    const query = searchInput?.toLowerCase().trim() ?? "";
    const sorted = fetchState.items
      .filter(v => {
        if (v.commission === 1) return false;
        if (!query) return true;
        return v.name.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const aTokens = BigInt(a.tokens);
        const bTokens = BigInt(b.tokens);

        if (bTokens > aTokens) return 1;
        if (bTokens < aTokens) return -1;
        return 0;
      });
    return sortLedgerValidatorFirst(sorted, currencyId);
  }, [fetchState.items, searchInput, currencyId]);

  return {
    validators: filtered,
    loading: fetchState.loading,
    error: fetchState.error,
  };
}

export function useEvmFamilyPreloadData(currencyId: string): {
  validators: StakingValidatorItem[];
} {
  const { validators } = useEvmStakingValidators(currencyId);
  return { validators };
}

export function useEvmFamilyMappedDelegations(account: StakingAccount): StakingMappedDelegation[] {
  const { validators } = useEvmFamilyPreloadData(account.currency.id);
  const delegations = account.stakingResources?.delegations;
  const unit = getAccountCurrency(account).units[0];
  return useMemo(() => {
    return mapDelegations(delegations ?? [], validators, unit);
  }, [delegations, validators, unit]);
}

export function useEvmFamilyDelegationsQuerySelector(
  account: StakingAccount,
  transaction: GenericTransaction,
  unit: Unit,
): {
  query: string;
  setQuery: (query: string) => void;
  options: StakingMappedDelegation[];
  value: StakingMappedDelegation | null | undefined;
} {
  const [query, setQuery] = useState<string>("");
  const delegations = account.stakingResources.delegations.filter(delegation =>
    delegation.pendingRewards.gt(0),
  );
  const validators = account.stakingResources.validators ?? [];

  const mappedDelegations = useMemo(
    () => mapDelegations(delegations, validators, unit),
    [delegations, validators, unit],
  );

  const options = useMemo<StakingMappedDelegation[]>(
    () =>
      mappedDelegations.filter(delegation =>
        (delegation.validator?.name ?? delegation.validatorName ?? delegation.validatorAddress)
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
      ),
    [mappedDelegations, query],
  );

  const value = useMemo(() => {
    return mappedDelegations.find(
      ({ validatorAddress }) => validatorAddress === transaction.valAddress,
    );
  }, [mappedDelegations, transaction.valAddress]);

  return {
    query,
    setQuery,
    options,
    value,
  };
}
