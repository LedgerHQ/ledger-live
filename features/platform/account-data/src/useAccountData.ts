import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { accountDataQueryKey, fetchAccountData } from "@domain/api-account-data-source";
import { accountRefKey, type AccountRef } from "@domain/entity-account";
import type {
  AccountDataBinding,
  AccountDataQuery,
  AccountDatum,
} from "@domain/entity-account-data";

export type UseAccountDataOptions<K extends AccountDatum> = {
  maxAge?: number;
  query?: AccountDataQuery<K>;
};

export type UseAccountDataResult = {
  pending: boolean;
  /** Read again, whatever the freshness. */
  refresh: () => Promise<void>;
  /** Present only on a paginated datum. */
  loadMore?: () => Promise<void>;
};

/**
 * Keep one datum of one account read while mounted. The data itself is read with the entity's own
 * selectors: this hook only drives the read.
 */
export function useAccountData<K extends AccountDatum, S>(
  binding: AccountDataBinding<K, S>,
  ref: AccountRef | undefined,
  options: UseAccountDataOptions<K> = {},
): UseAccountDataResult {
  const dispatch = useDispatch<ThunkDispatch<S, unknown, UnknownAction>>();
  const { maxAge, query } = options;
  const refKey = ref ? accountRefKey(ref) : undefined;
  // By value: a caller passing `{ limit: 50 }` inline must not re-read on every render.
  const queryKey = accountDataQueryKey(query);

  const latest = useRef({ ref, query });
  latest.current = { ref, query };

  useEffect(() => {
    const current = latest.current;
    if (!refKey || !current.ref) return;
    void dispatch(fetchAccountData(binding, current.ref, { maxAge, query: current.query }));
  }, [dispatch, binding, refKey, maxAge, queryKey]);

  const accountId = ref?.accountId;
  const pending = useSelector((state: S) =>
    accountId ? binding.selectPending(state, accountId) : false,
  );

  const refresh = useCallback(async () => {
    const current = latest.current;
    if (!current.ref) return;
    await dispatch(fetchAccountData(binding, current.ref, { maxAge: 0, query: current.query }));
  }, [dispatch, binding]);

  const loadMore = useCallback(async () => {
    const current = latest.current;
    if (!current.ref) return;
    await dispatch(fetchAccountData(binding, current.ref, { query: current.query, more: true }));
  }, [dispatch, binding]);

  const paginated = binding.selectNextQuery !== undefined;
  return useMemo(
    () => (paginated ? { pending, refresh, loadMore } : { pending, refresh }),
    [paginated, pending, refresh, loadMore],
  );
}
