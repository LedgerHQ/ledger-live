import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  accountDataQueryKey,
  fetchAccountData,
  fetchMoreAccountData,
} from "@domain/api-account-data";
import {
  selectAccountDataStatus,
  type AccountDataError,
  type AccountDataKind,
  type AccountDataQuery,
  type AccountDataRootState,
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
  /** A read is in flight. */
  pending: boolean;
  /** Of the last read; the stored data, if any, is still there. */
  error: AccountDataError | undefined;
  /** The stored data has a next page, for this query. */
  hasMore: boolean;
  /** Reads again, whatever the freshness. */
  refresh: () => Promise<void>;
  /** Reads the next page; does nothing without one. */
  loadMore: () => Promise<void>;
};

/** Holds the value first seen for `key` in state, so a discarded render cannot replace it. */
function useHeldByKey<T>(value: T, key: string | undefined): T {
  const [held, setHeld] = useState({ key, value });
  if (held.key === key) return held.value;
  setHeld({ key, value });
  return value;
}

/** Keeps one kind of data of one account read while mounted; the data is read with the entity's selectors. */
export function useAccountData<K extends AccountDataKind>(
  kind: K,
  descriptor: AccountDescriptor | undefined,
  { maxAge, query }: UseAccountDataOptions<K> = {},
): UseAccountDataResult {
  const dispatch = useDispatch<ThunkDispatch<AccountDataRootState, unknown, UnknownAction>>();
  // By value: a new object for the same account, or an inline query, must not read again.
  const queryKey = accountDataQueryKey(query);
  const account = useHeldByKey(descriptor, descriptor && accountDescriptorKey(descriptor));
  const accountQuery = useHeldByKey(query, queryKey);

  const accountUUID = useMemo(() => (account ? computeAccountUUID(account) : undefined), [account]);

  useEffect(() => {
    if (!account) return;
    void dispatch(fetchAccountData(kind, account, { maxAge, query: accountQuery }));
  }, [dispatch, kind, account, maxAge, accountQuery]);

  const status = useSelector((state: AccountDataRootState) =>
    accountUUID ? selectAccountDataStatus(state, kind, accountUUID) : undefined,
  );

  const refresh = useCallback(async () => {
    if (!account) return;
    await dispatch(fetchAccountData(kind, account, { maxAge: 0, query: accountQuery }));
  }, [dispatch, kind, account, accountQuery]);

  const loadMore = useCallback(async () => {
    if (!account) return;
    await dispatch(fetchMoreAccountData(kind, account, { query: accountQuery }));
  }, [dispatch, kind, account, accountQuery]);

  const pending = status?.request !== undefined;
  const error = status?.error;
  const hasMore = status?.nextCursor !== undefined && status.queryKey === queryKey;
  return useMemo(
    () => ({ accountUUID, pending, error, hasMore, refresh, loadMore }),
    [accountUUID, pending, error, hasMore, refresh, loadMore],
  );
}
