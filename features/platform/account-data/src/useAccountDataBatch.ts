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
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { AccountDescriptor } from "@domain/entity-account-descriptor/descriptor";
import { selectAccountDescriptor, type WithAccountEntries } from "./internals/accountEntries";
import { accountsToRead, type ReadRecord } from "./internals/accountsToRead";
import { summarizeStatuses } from "./internals/summarizeStatuses";
import { useHeldByKey } from "./internals/useHeldByKey";
import type { UseAccountDataOptions } from "./useAccountData";

export type UseAccountDataBatchResult = {
  /** The accounts the accounts slice holds, once each, in the order given. */
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
  accountUUIDs: readonly AccountUUID[],
  { maxAge, query }: UseAccountDataOptions<K> = {},
): UseAccountDataBatchResult {
  const dispatch = useDispatch<ThunkDispatch<AccountDataRootState, unknown, UnknownAction>>();
  const unique = [...new Set(accountUUIDs)];
  const descriptors = useSelector(
    (state: WithAccountEntries) => unique.map(uuid => selectAccountDescriptor(state, uuid)),
    shallowEqual,
  );
  const byUUID = new Map<AccountUUID, AccountDescriptor>();
  unique.forEach((uuid, i) => {
    const descriptor = descriptors[i];
    if (descriptor) byUUID.set(uuid, descriptor);
  });
  // By value: a new array of the same accounts, or an inline query, must not read again.
  const held = useHeldByKey(byUUID, [...byUUID.keys()].join("\n"));
  const queryKey = accountDataQueryKey(query);
  const accountQuery = useHeldByKey(query, queryKey);

  const accounts = useMemo(() => [...held.values()], [held]);
  const heldUUIDs = useMemo(() => [...held.keys()], [held]);

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
      heldUUIDs.map(uuid => state.accountData[kind]?.[uuid]?.[queryKey]),
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
    () => ({ accountUUIDs: heldUUIDs, ...summarizeStatuses(heldUUIDs, statuses), refresh }),
    [statuses, heldUUIDs, refresh],
  );
}
