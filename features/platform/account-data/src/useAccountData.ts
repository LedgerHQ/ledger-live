import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { fetchAccountData } from "@domain/api-account-data-source";
import type { AccountId } from "@domain/entity-account";
import { computeAccountId } from "@domain/entity-account-alias";
import { accountDescriptorKey, type AccountDescriptor } from "@domain/entity-account-descriptor";
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
  /** The id the account is keyed by in the entity slices. */
  accountId: AccountId | undefined;
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
  descriptor: AccountDescriptor | undefined,
  options: UseAccountDataOptions<K> = {},
): UseAccountDataResult {
  const dispatch = useDispatch<ThunkDispatch<S, unknown, UnknownAction>>();
  const { maxAge, query } = options;
  const descriptorKey = descriptor ? accountDescriptorKey(descriptor) : undefined;
  // By value: a caller passing `{ limit: 50 }` inline must not re-read on every render.
  const queryKey = JSON.stringify(query ?? null);

  const latest = useRef({ descriptor, query });
  latest.current = { descriptor, query };

  useEffect(() => {
    const current = latest.current;
    if (!descriptorKey || !current.descriptor) return;
    void dispatch(fetchAccountData(binding, current.descriptor, { maxAge, query: current.query }));
  }, [dispatch, binding, descriptorKey, maxAge, queryKey]);

  const accountId = useMemo(
    () => (descriptorKey && descriptor ? computeAccountId(descriptor) : undefined),
    // The key is the descriptor by value; a new object of the same account must not recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [descriptorKey],
  );
  const pending = useSelector((state: S) =>
    accountId ? binding.selectPending(state, accountId) : false,
  );

  const refresh = useCallback(async () => {
    const current = latest.current;
    if (!current.descriptor) return;
    await dispatch(
      fetchAccountData(binding, current.descriptor, { maxAge: 0, query: current.query }),
    );
  }, [dispatch, binding]);

  const loadMore = useCallback(async () => {
    const current = latest.current;
    if (!current.descriptor) return;
    await dispatch(
      fetchAccountData(binding, current.descriptor, { query: current.query, more: true }),
    );
  }, [dispatch, binding]);

  const paginated = binding.selectNextQuery !== undefined;
  return useMemo(
    () => (paginated ? { accountId, pending, refresh, loadMore } : { accountId, pending, refresh }),
    [paginated, accountId, pending, refresh, loadMore],
  );
}
