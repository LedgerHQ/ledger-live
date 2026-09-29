import {
  accountOperationsAppended,
  accountOperationsFailed,
  accountOperationsReceived,
  accountOperationsRequested,
  accountOperationsSlice,
  type WithAccountOperations,
} from "@domain/entity-account-operations";
import {
  type AccountDataRouter,
  type AccountOperationsQuery,
  type AccountRef,
  isFresh,
  readThrough,
} from "@features/platform-account-data";

export const DEFAULT_OPERATIONS_MAX_AGE = 60_000;
export const DEFAULT_OPERATIONS_PAGE_SIZE = 50;

type Options = { limit?: number; signal?: AbortSignal };

const { selectAccountOperationsAt, selectAccountOperationsStatus, selectAccountOperationsEntry } =
  accountOperationsSlice.selectors;

async function readPage(
  router: AccountDataRouter,
  ref: AccountRef,
  query: AccountOperationsQuery,
  signal?: AbortSignal,
) {
  const source = router.resolve("getOperations", ref);
  const page = await source.getOperations(ref, query, signal);
  return { ...page, sourceId: source.id, accountId: ref.accountId, at: new Date().toISOString() };
}

type Dispatch = (action: { type: string }) => unknown;

export function fetchAccountOperations(
  router: AccountDataRouter,
  ref: AccountRef,
  {
    maxAge = DEFAULT_OPERATIONS_MAX_AGE,
    limit = DEFAULT_OPERATIONS_PAGE_SIZE,
    signal,
  }: Options & { maxAge?: number } = {},
) {
  return async (dispatch: Dispatch, getState: () => WithAccountOperations): Promise<void> => {
    const state = getState();
    const { accountId } = ref;
    if (selectAccountOperationsStatus(state, accountId).pending) return;
    if (isFresh(selectAccountOperationsAt(state, accountId), maxAge)) return;

    await readThrough(dispatch, {
      requested: accountOperationsRequested(accountId),
      read: () => readPage(router, ref, { limit }, signal),
      received: accountOperationsReceived,
      failed: error => accountOperationsFailed({ accountId, error }),
    });
  };
}

export function fetchMoreAccountOperations(
  router: AccountDataRouter,
  ref: AccountRef,
  { limit = DEFAULT_OPERATIONS_PAGE_SIZE, signal }: Options = {},
) {
  return async (dispatch: Dispatch, getState: () => WithAccountOperations): Promise<void> => {
    const state = getState();
    const { accountId } = ref;
    if (selectAccountOperationsStatus(state, accountId).pending) return;
    const { nextCursor } = selectAccountOperationsEntry(state, accountId);
    if (nextCursor === undefined) return;

    await readThrough(dispatch, {
      requested: accountOperationsRequested(accountId),
      read: () => readPage(router, ref, { cursor: nextCursor, limit }, signal),
      received: accountOperationsAppended,
      failed: error => accountOperationsFailed({ accountId, error }),
    });
  };
}
