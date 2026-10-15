import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { accountDataQueryKey, fetchAccountData } from "@domain/api-account-data-source";
import type {
  AccountDataBinding,
  AccountDataKind,
  AccountDataQuery,
} from "@domain/entity-account-data";
import {
  accountDescriptorKey,
  computeAccountUUID,
  type AccountDescriptor,
  type AccountUUID,
} from "@domain/entity-account-descriptor";

export type UseAccountDataOptions<K extends AccountDataKind> = {
  maxAge?: number;
  query?: AccountDataQuery<K>;
};

export type UseAccountDataResult = {
  /** What the entity slices key the account by. */
  accountUUID: AccountUUID | undefined;
  pending: boolean;
  /** Reads again, whatever the freshness. */
  refresh: () => Promise<void>;
  /** Only on a paginated kind. */
  loadMore?: () => Promise<void>;
};

/** Holds the value first seen for `key` in state, so a discarded render cannot replace it. */
function useHeldByKey<T>(value: T, key: string | undefined): T {
  const [held, setHeld] = useState({ key, value });
  if (held.key === key) return held.value;
  setHeld({ key, value });
  return value;
}

/** Keeps one kind of data of one account read while mounted; the data is read with the entity selectors. */
export function useAccountData<K extends AccountDataKind, S>(
  binding: AccountDataBinding<K, S>,
  descriptor: AccountDescriptor | undefined,
  { maxAge, query }: UseAccountDataOptions<K> = {},
): UseAccountDataResult {
  const dispatch = useDispatch<ThunkDispatch<S, unknown, UnknownAction>>();
  // By value: a new object for the same account, or an inline query, must not read again.
  const descriptorKey = descriptor ? accountDescriptorKey(descriptor) : undefined;
  const queryKey = accountDataQueryKey(query);

  const account = useHeldByKey(descriptor, descriptorKey);
  const accountQuery = useHeldByKey(query, queryKey);

  const accountUUID = useMemo(() => (account ? computeAccountUUID(account) : undefined), [account]);

  useEffect(() => {
    if (!account) return;
    void dispatch(fetchAccountData(binding, account, { maxAge, query: accountQuery }));
  }, [dispatch, binding, account, maxAge, accountQuery]);

  const pending = useSelector((state: S) =>
    accountUUID ? binding.selectPending(state, accountUUID) : false,
  );

  const refresh = useCallback(async () => {
    if (!account) return;
    await dispatch(fetchAccountData(binding, account, { maxAge: 0, query: accountQuery }));
  }, [dispatch, binding, account, accountQuery]);

  const loadMore = useCallback(async () => {
    if (!account) return;
    await dispatch(fetchAccountData(binding, account, { query: accountQuery, more: true }));
  }, [dispatch, binding, account, accountQuery]);

  const paginated = binding.selectNextQuery !== undefined;
  return useMemo(
    () =>
      paginated ? { accountUUID, pending, refresh, loadMore } : { accountUUID, pending, refresh },
    [paginated, accountUUID, pending, refresh, loadMore],
  );
}
