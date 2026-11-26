import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { fetchAccountData, fetchMoreAccountData } from "@domain/api-account-data";
import {
  accountDataQueryKey,
  selectAccountDataStatus,
  type AccountDataError,
  type AccountDataKind,
  type AccountDataQuery,
  type AccountDataRootState,
} from "@domain/entity-account-data";
import type { AccountUUID } from "@domain/entity-account";
import { selectAccountDescriptor, type WithAccountEntries } from "./internals/accountEntries";
import { useHeldByKey } from "./internals/useHeldByKey";

export type UseAccountDataOptions<K extends AccountDataKind> = {
  maxAge?: number;
  query?: AccountDataQuery<K>;
};

export type UseAccountDataResult = {
  /** What the entity slices key the account by; absent until the accounts slice holds the account. */
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

/** Keeps one kind of data of one account read while mounted; the descriptor never leaves the hook. */
export function useAccountData<K extends AccountDataKind>(
  kind: K,
  accountUUID: AccountUUID | undefined,
  { maxAge, query }: UseAccountDataOptions<K> = {},
): UseAccountDataResult {
  const dispatch = useDispatch<ThunkDispatch<AccountDataRootState, unknown, UnknownAction>>();
  const descriptor = useSelector((state: WithAccountEntries) =>
    accountUUID ? selectAccountDescriptor(state, accountUUID) : undefined,
  );
  // By value: an inline query must not read again; an account is its AccountUUID.
  const queryKey = accountDataQueryKey(query);
  const account = useHeldByKey(descriptor, descriptor && accountUUID);
  const accountQuery = useHeldByKey(query, queryKey);

  useEffect(() => {
    if (!account) return;
    void dispatch(fetchAccountData(kind, account, { maxAge, query: accountQuery }));
  }, [dispatch, kind, account, maxAge, accountQuery]);

  const heldUUID = account ? accountUUID : undefined;
  const status = useSelector((state: AccountDataRootState) =>
    heldUUID ? selectAccountDataStatus(state, kind, heldUUID, accountQuery) : undefined,
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
  const hasMore = status?.nextCursor !== undefined;
  return useMemo(
    () => ({ accountUUID: heldUUID, pending, error, hasMore, refresh, loadMore }),
    [heldUUID, pending, error, hasMore, refresh, loadMore],
  );
}
