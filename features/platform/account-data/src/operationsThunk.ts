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
import type { AccountRef } from "./source";

/**
 * A history head older than this is worth re-checking.
 *
 * Longer than the balance's 30s on purpose: a balance is what a screen shows first and what a user
 * watches change, while a new operation appears at block cadence and the pending-operation loop
 * already covers the case where the user is waiting for one.
 */
export const DEFAULT_OPERATIONS_MAX_AGE = 60_000;

/** How many operations a head read asks for. A soft limit — a source may return fewer or more. */
export const DEFAULT_OPERATIONS_PAGE_SIZE = 50;

export type FetchAccountOperationsOptions = {
  /** Max acceptable age in ms. `0` forces a round-trip. Defaults to {@link DEFAULT_OPERATIONS_MAX_AGE}. */
  maxAge?: number;
  limit?: number;
  /** Sources to read from. Defaults to the ones registered at the composition root. */
  sources?: readonly AccountOperationsSource[];
  signal?: AbortSignal;
};

type Dispatch = (action: { type: string }) => unknown;
type GetState = () => WithAccountOperations;

const { selectAccountOperationsAt, selectAccountOperationsStatus, selectAccountOperationsEntry } =
  accountOperationsSlice.selectors;

/**
 * Read the head of an account's history — a first load, or a refresh.
 *
 * Same two guards as the balance thunk, with one difference that is the whole reason this file
 * exists: freshness is read off the **account**, not off a row. `at` on an operation is when it
 * happened; the question here is when we last looked for newer ones, which only the read itself can
 * answer.
 */
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
    // A token account's history is produced by its parent's read, exactly as its balance is: the
    // chain reports transfers against an address, and the rows are split out by account id.
    if (ref.parentId) return;

    const state = getState();
    if (selectAccountOperationsStatus(state, ref.accountId).pending) return;
    const at = selectAccountOperationsAt(state, ref.accountId);
    if (maxAge > 0 && at !== undefined && Date.now() - at < maxAge) return;

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
    }
  };
}

/**
 * Read the next page, further back in the history.
 *
 * **Not freshness-guarded, on purpose.** "Is the head stale?" and "is there more below?" are
 * different questions, and answering the second with the first is how a paginated list stops
 * loading: a user scrolling through a history reaches the bottom well inside any sensible max-age
 * window, and a freshness check there would return a page it already has.
 *
 * Guarded instead on the two things that actually make the call pointless: a read already in
 * flight, and no cursor to resume from.
 */
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
    if (ref.parentId) return;

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
          // Not the read's own instant: appending an older page says nothing about the head.
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
