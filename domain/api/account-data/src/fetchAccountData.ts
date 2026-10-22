import { nanoid } from "@reduxjs/toolkit";
import {
  accountDataFailed,
  accountDataReceived,
  accountDataRequested,
  selectAccountDataStatus,
  type AccountDataError,
  type AccountDataKind,
  type AccountDataQuery,
  type AccountDataRootState,
} from "@domain/entity-account-data";
import {
  computeAccountUUID,
  type AccountDescriptor,
  type AccountUUID,
} from "@domain/entity-account-descriptor";
import { getAccountDataRuntime, type AccountDataRuntime } from "./extra";
import { accountDataQueryKey } from "./queryKey";
import type { AccountDataReadOptions } from "./router";

export const DEFAULT_ACCOUNT_DATA_MAX_AGE = 30_000;

export type FetchAccountDataOptions<K extends AccountDataKind> = {
  /** A head read of the same query younger than this is not repeated. `0` always reads. */
  maxAge?: number;
  query?: AccountDataQuery<K>;
};

type Dispatch = (action: { type: string }) => unknown;

type GetState = () => AccountDataRootState;

type Account<K extends AccountDataKind = AccountDataKind> = {
  kind: K;
  descriptor: AccountDescriptor;
  accountUUID: AccountUUID;
};

const errorOf = (error: unknown): AccountDataError =>
  error instanceof Error
    ? { name: error.name, message: error.message }
    : { name: "Error", message: String(error) };

/** A paginated kind's result carries the cursor of its next page. */
const nextCursorOf = (data: unknown): string | undefined =>
  typeof data === "object" &&
  data !== null &&
  "nextCursor" in data &&
  typeof data.nextCursor === "string"
    ? data.nextCursor
    : undefined;

/** Reads through the router into the slices, unless a newer read of the account started meanwhile. */
async function read<K extends AccountDataKind>(
  dispatch: Dispatch,
  getState: GetState,
  { router, inflight }: AccountDataRuntime,
  { kind, descriptor, accountUUID }: Account<K>,
  append: boolean,
  options: AccountDataReadOptions<K>,
): Promise<void> {
  const requestId = nanoid();
  const queryKey = accountDataQueryKey(options.query);
  const current = () =>
    selectAccountDataStatus(getState(), kind, accountUUID)?.request?.id === requestId;
  // Starts after the request is published, and is registered before it, so what reacts to it can wait.
  const done = Promise.resolve().then(async () => {
    try {
      const { data, sourceId } = await router.read(kind, descriptor, options);
      if (!current()) return;
      const readAt = Date.now();
      const nextCursor = nextCursorOf(data);
      dispatch(
        accountDataReceived({
          kind,
          accountUUID,
          requestId,
          data,
          sourceId,
          append,
          readAt,
          nextCursor,
        }),
      );
    } catch (error) {
      if (current())
        dispatch(accountDataFailed({ kind, accountUUID, requestId, error: errorOf(error) }));
    }
  });
  inflight.set(requestId, done);
  try {
    dispatch(accountDataRequested({ kind, accountUUID, requestId, queryKey, append }));
    await done;
  } finally {
    inflight.delete(requestId);
  }
}

/** Waits for the head reads of `queryKey` in flight, including the ones started meanwhile. */
async function settled(
  getState: GetState,
  runtime: AccountDataRuntime,
  account: Account,
  queryKey: string,
  awaited?: string,
): Promise<void> {
  const request = selectAccountDataStatus(getState(), account.kind, account.accountUUID)?.request;
  if (!request || request.append || request.queryKey !== queryKey || request.id === awaited) return;
  const done = runtime.inflight.get(request.id);
  if (!done) return;
  await done;
  return settled(getState, runtime, account, queryKey, request.id);
}

/** Reads the head of one kind of data of one account, unless fresh or already in flight. */
export function fetchAccountData<K extends AccountDataKind>(
  kind: K,
  descriptor: AccountDescriptor,
  { maxAge = DEFAULT_ACCOUNT_DATA_MAX_AGE, query }: FetchAccountDataOptions<K> = {},
) {
  return async (dispatch: Dispatch, getState: GetState, extra: unknown): Promise<void> => {
    const runtime = getAccountDataRuntime(extra);
    const account = { kind, descriptor, accountUUID: computeAccountUUID(descriptor) };
    const queryKey = accountDataQueryKey(query);
    const status = selectAccountDataStatus(getState(), kind, account.accountUUID);
    const head = status?.request?.append === false ? status.request : undefined;
    if (maxAge > 0 && head?.queryKey === queryKey) {
      return settled(getState, runtime, account, queryKey);
    }
    // A stamp from the future is a clock that moved, not a fresh read.
    const age = status?.readAt === undefined ? undefined : Date.now() - status.readAt;
    const fresh = age !== undefined && age >= 0 && age < maxAge;
    if (!head && status?.queryKey === queryKey && fresh) return;
    await read(dispatch, getState, runtime, account, false, { query });
    return settled(getState, runtime, account, queryKey);
  };
}

/** Reads the page after the stored one, from the source that answered it, for the stored head's query only. */
export function fetchMoreAccountData<K extends AccountDataKind>(
  kind: K,
  descriptor: AccountDescriptor,
  { query }: Pick<FetchAccountDataOptions<K>, "query"> = {},
) {
  return async (dispatch: Dispatch, getState: GetState, extra: unknown): Promise<void> => {
    const runtime = getAccountDataRuntime(extra);
    const accountUUID = computeAccountUUID(descriptor);
    const status = selectAccountDataStatus(getState(), kind, accountUUID);
    const { sourceId, nextCursor: cursor } = status ?? {};
    // A page already on its way is awaited, so a caller can wait for it before asking the next.
    if (status?.request) return runtime.inflight.get(status.request.id);
    if (!status || sourceId === undefined || cursor === undefined) return;
    if (status.queryKey !== accountDataQueryKey(query)) return;
    await read(dispatch, getState, runtime, { kind, descriptor, accountUUID }, true, {
      query,
      sourceId,
      cursor,
    });
  };
}
