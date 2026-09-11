import {
  accountOperationsAppended,
  accountOperationsFailed,
  accountOperationsReceived,
  accountOperationsRequested,
  accountOperationsSlice,
  type WithAccountOperations,
} from "@domain/entity-account-operations";
import { getAccountOperationsSources } from "./register";
import { readAccountOperations, type AccountOperationsSource } from "./operations";
import { refKeyOf, type AccountRef } from "./source";

export const DEFAULT_OPERATIONS_MAX_AGE = 60_000;

export const DEFAULT_OPERATIONS_PAGE_SIZE = 50;

export type FetchAccountOperationsOptions = {
  maxAge?: number;
  limit?: number;
  sources?: readonly AccountOperationsSource[];
  signal?: AbortSignal;
};

type Dispatch = (action: { type: string }) => unknown;
type GetState = () => WithAccountOperations;

const { selectAccountOperationsAt, selectAccountOperationsStatus, selectAccountOperationsEntry } =
  accountOperationsSlice.selectors;

// Which ref each in-flight head read is for, so a read of the same account under a *different* ref
// is not dropped by the pending flag with nothing left to re-trigger it.
const inflightRefKey = new Map<string, string>();

export function fetchAccountOperations(
  ref: AccountRef,
  options: FetchAccountOperationsOptions = {},
) {
  const {
    maxAge = DEFAULT_OPERATIONS_MAX_AGE,
    limit = DEFAULT_OPERATIONS_PAGE_SIZE,
    sources = getAccountOperationsSources(),
    signal,
  } = options;

  return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const state = getState();
    const refKey = refKeyOf(ref);
    const pending = selectAccountOperationsStatus(state, ref.accountId).pending;
    if (pending && inflightRefKey.get(ref.accountId) === refKey) return;
    const at = selectAccountOperationsAt(state, ref.accountId);
    // A negative age is a clock that moved, not a fresh read: treated as stale rather than trusted
    // for however long the stamp is ahead.
    const age = at === undefined ? undefined : Date.now() - at;
    if (maxAge > 0 && age !== undefined && age >= 0 && age < maxAge) return;

    inflightRefKey.set(ref.accountId, refKey);
    dispatch(accountOperationsRequested(ref.accountId));
    try {
      const page = await readAccountOperations(ref, sources, { limit }, signal);
      dispatch(
        accountOperationsReceived({
          accountId: ref.accountId,
          operations: page.operations,
          nextCursor: page.nextCursor,
          complete: page.complete,
          total: page.total,
          sourceId: page.sourceId,
          at: new Date().toISOString(),
        }),
      );
    } catch (error) {
      dispatch(
        accountOperationsFailed({
          accountId: ref.accountId,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    } finally {
      if (inflightRefKey.get(ref.accountId) === refKey) inflightRefKey.delete(ref.accountId);
    }
  };
}

export function fetchMoreAccountOperations(
  ref: AccountRef,
  options: Omit<FetchAccountOperationsOptions, "maxAge"> = {},
) {
  const {
    limit = DEFAULT_OPERATIONS_PAGE_SIZE,
    sources = getAccountOperationsSources(),
    signal,
  } = options;

  return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const state = getState();
    if (selectAccountOperationsStatus(state, ref.accountId).pending) return;
    const { nextCursor } = selectAccountOperationsEntry(state, ref.accountId);
    if (nextCursor === undefined) return;

    dispatch(accountOperationsRequested(ref.accountId));
    try {
      const page = await readAccountOperations(ref, sources, { cursor: nextCursor, limit }, signal);
      dispatch(
        accountOperationsAppended({
          accountId: ref.accountId,
          operations: page.operations,
          nextCursor: page.nextCursor,
          complete: page.complete,
          total: page.total,
          sourceId: page.sourceId,
          at: selectAccountOperationsEntry(state, ref.accountId).at ?? new Date().toISOString(),
        }),
      );
    } catch (error) {
      dispatch(
        accountOperationsFailed({
          accountId: ref.accountId,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  };
}
