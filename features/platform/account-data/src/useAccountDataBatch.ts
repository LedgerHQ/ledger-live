import { useCallback, useEffect, useMemo, useRef } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { fetchAccountData } from "@domain/api-account-data";
import {
  accountDataQueryKey,
  type AccountDataError,
  type AccountDataKind,
  type AccountDataRootState,
} from "@domain/entity-account-data";
import {
  computeAccountUUID,
  type AccountDescriptor,
  type AccountUUID,
} from "@domain/entity-account-descriptor";
import { accountsToRead, type ReadRecord } from "./internals/accountsToRead";
import { summarizeStatuses } from "./internals/summarizeStatuses";
import { uniqueByKey } from "./internals/uniqueByKey";
import { useHeldByKey } from "./internals/useHeldByKey";
import type { UseAccountDataOptions } from "./useAccountData";

export type UseAccountDataBatchResult = {
  /** What the entity slices key each account by, once each, in the order of the descriptors. */
  accountUUIDs: AccountUUID[];
  /** A head read of at least one account is in flight; next pages loaded elsewhere do not count. */
  pending: boolean;
  /** The accounts whose last read failed; their stored data, if any, is still there. */
  errors: { accountUUID: AccountUUID; error: AccountDataError }[];
  /** Reads every account again, whatever the freshness. */
  refresh: () => Promise<void>;
};

/** Keeps one kind of data of many accounts read while mounted, in one tick so the router batches them per source. */
export function useAccountDataBatch<K extends AccountDataKind>(
  kind: K,
  descriptors: readonly AccountDescriptor[],
  { maxAge, query }: UseAccountDataOptions<K> = {},
): UseAccountDataBatchResult {
  const dispatch = useDispatch<ThunkDispatch<AccountDataRootState, unknown, UnknownAction>>();
  const byKey = uniqueByKey(descriptors);
  // By value: a new array of the same accounts, or an inline query, must not read again.
  const held = useHeldByKey(byKey, [...byKey.keys()].join("\n"));
  const queryKey = accountDataQueryKey(query);
  const accountQuery = useHeldByKey(query, queryKey);

  const accounts = useMemo(() => [...held.values()], [held]);
  const accountUUIDs = useMemo(() => accounts.map(computeAccountUUID), [accounts]);

  const read = useRef<ReadRecord | undefined>(undefined);
  useEffect(() => {
    const options = [kind, maxAge ?? "", queryKey].join("\u0000");
    const { toRead, record } = accountsToRead(read.current, {
      store: dispatch,
      options,
      keys: [...held.keys()],
    });
    read.current = record;
    const reading = new Set(toRead);
    for (const [key, account] of held)
      if (reading.has(key))
        void dispatch(fetchAccountData(kind, account, { maxAge, query: accountQuery }));
  }, [dispatch, kind, held, maxAge, queryKey, accountQuery]);

  const statuses = useSelector(
    (state: AccountDataRootState) =>
      accountUUIDs.map(uuid => state.accountData[kind]?.[uuid]?.[queryKey]),
    shallowEqual,
  );

  const refresh = useCallback(async () => {
    await Promise.all(
      accounts.map(account =>
        dispatch(fetchAccountData(kind, account, { maxAge: 0, query: accountQuery })),
      ),
    );
  }, [dispatch, kind, accounts, accountQuery]);

  return useMemo(
    () => ({ accountUUIDs, ...summarizeStatuses(accountUUIDs, statuses), refresh }),
    [statuses, accountUUIDs, refresh],
  );
}
