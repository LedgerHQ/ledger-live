import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  accountOperationsSlice,
  type AccountOperation,
  type AccountOperationsStatus,
  type WithAccountOperations,
} from "@domain/entity-account-operations";
import {
  fetchAccountOperations,
  fetchMoreAccountOperations,
  type FetchAccountOperationsOptions,
} from "./operationsThunk";
import type { AccountRef } from "./source";

const NO_OPERATIONS: readonly AccountOperation[] = [];
const IDLE: AccountOperationsStatus = { pending: false };

const {
  selectAccountOperations,
  selectAccountOperationsStatus,
  selectHasMoreAccountOperations,
  selectAccountOperationsTotal,
} = accountOperationsSlice.selectors;

/** Same rule as the balance hook: every field of the ref, never the object's identity. */
const refKeyOf = (ref: AccountRef | undefined): string | undefined =>
  ref && !ref.parentId
    ? [ref.accountId, ref.currencyId, ref.address, ref.derivationMode].join("|")
    : undefined;

export type UseAccountOperationsResult = {
  /** The loaded window, newest first. */
  operations: readonly AccountOperation[];
  /** Whether asking for more would return anything. */
  hasMore: boolean;
  /**
   * How many operations the account has — `undefined` when that is not knowable.
   *
   * A list rendering "N transactions" has to handle the `undefined` case, because on a paginated
   * source there is no honest number to show until the history is fully loaded. That is a real
   * behaviour change from `account.operationsCount`, not an omission.
   */
  total: number | undefined;
  status: AccountOperationsStatus;
  /** Read the next page. No-op while a read is in flight or when the history is exhausted. */
  loadMore: () => Promise<void>;
  /** Re-read the head, ignoring freshness. For a pull-to-refresh. */
  refresh: () => Promise<void>;
};

/**
 * The account's operation history, one page at a time.
 *
 * Takes the **main account's** ref; a token account's rows arrive with its parent's read, so passing
 * a token ref reads its window without triggering anything.
 */
export function useAccountOperations(
  ref: AccountRef | undefined,
  options?: FetchAccountOperationsOptions,
): UseAccountOperationsResult {
  const dispatch = useDispatch<ThunkDispatch<WithAccountOperations, unknown, UnknownAction>>();
  const accountId = ref?.accountId;
  const maxAge = options?.maxAge;
  const limit = options?.limit;
  const refKey = refKeyOf(ref);

  const latest = useRef(ref);
  latest.current = ref;

  useEffect(() => {
    const current = latest.current;
    if (!refKey || !current) return;
    void dispatch(fetchAccountOperations(current, { maxAge, limit }));
  }, [dispatch, refKey, maxAge, limit]);

  const operations = useSelector((state: WithAccountOperations) =>
    accountId ? selectAccountOperations(state, accountId) : NO_OPERATIONS,
  );
  const hasMore = useSelector((state: WithAccountOperations) =>
    accountId ? selectHasMoreAccountOperations(state, accountId) : false,
  );
  const total = useSelector((state: WithAccountOperations) =>
    accountId ? selectAccountOperationsTotal(state, accountId) : undefined,
  );
  const status = useSelector((state: WithAccountOperations) =>
    accountId ? selectAccountOperationsStatus(state, accountId) : IDLE,
  );

  const loadMore = useCallback(async () => {
    const current = latest.current;
    if (!current || current.parentId) return;
    await dispatch(fetchMoreAccountOperations(current, { limit }));
  }, [dispatch, limit]);

  const refresh = useCallback(async () => {
    const current = latest.current;
    if (!current || current.parentId) return;
    await dispatch(fetchAccountOperations(current, { maxAge: 0, limit }));
  }, [dispatch, limit]);

  return { operations, hasMore, total, status, loadMore, refresh };
}
