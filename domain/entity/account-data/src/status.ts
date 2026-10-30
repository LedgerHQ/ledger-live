import { createSlice, type PayloadAction, type UnknownAction } from "@reduxjs/toolkit";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import { accountDataQueryKey } from "./queryKey";
import type { AccountDataKind, AccountDataQuery, AccountDataResult } from "./registry";
import type { AccountDataSourceId } from "./sourceId";

export type AccountDataError = { name: string; message: string };

/** The read in flight: a head read (`append: false`) or a next page. */
export type AccountDataRequest = { id: string; append: boolean };

/** How the reads of one kind, account and query went. The data itself lives in the entity's slice. */
export type AccountDataStatus = {
  request?: AccountDataRequest;
  /** Of the last read, cleared by the next answer. */
  error?: AccountDataError;
  /** The source that answered the stored data: only it can serve its next page. */
  sourceId?: AccountDataSourceId;
  /** When the stored head was read, in ms since epoch. */
  readAt?: number;
  /** Where the stored data continues, at its source; absent at the end or on a kind without pages. */
  nextCursor?: string;
};

/** By query, as `accountDataQueryKey` writes it: each query of an account is read and paged on its own. */
export type AccountDataStatusByQuery = Partial<Record<string, AccountDataStatus>>;

/** By kind, then by account, then by query. Keyed by string, so the shape holds whatever kinds the registry has. */
export type AccountDataState = Partial<
  Record<string, Partial<Record<AccountUUID, AccountDataStatusByQuery>>>
>;

export type AccountDataRootState = { accountData: AccountDataState };

type Target = {
  kind: AccountDataKind;
  accountUUID: AccountUUID;
  queryKey: string;
  requestId: string;
};

export type AccountDataRequested = Target & { append: boolean };

export type AccountDataFailed = Target & { error: AccountDataError };

export type AccountDataReceived<K extends AccountDataKind> = {
  kind: K;
  accountUUID: AccountUUID;
  /** The query `data` answers, as `accountDataQueryKey` writes it: the entity stores it under that key. */
  queryKey: string;
  requestId: string;
  data: AccountDataResult<K>;
  sourceId: AccountDataSourceId;
  /** `true` for a next page, which the entity merges into what it stores; `false` for a head read, which replaces it. */
  append: boolean;
  readAt: number;
  nextCursor?: string;
};

const RECEIVED = "accountData/received";

/** Stores an answer: the entity slice of `kind` takes `data`, this slice the rest. */
export function accountDataReceived<K extends AccountDataKind>(payload: AccountDataReceived<K>) {
  return { type: RECEIVED, payload };
}

const hasKind = (payload: unknown, kind?: AccountDataKind) =>
  typeof payload === "object" &&
  payload !== null &&
  "kind" in payload &&
  (kind === undefined || payload.kind === kind);

/** What an entity slice matches to store its kind's answers. */
export function isAccountDataReceived<K extends AccountDataKind>(kind: K) {
  return (action: UnknownAction): action is ReturnType<typeof accountDataReceived<K>> =>
    action.type === RECEIVED && hasKind(action.payload, kind);
}

/** An answer of any kind, for observers of the whole layer. */
export const isAnyAccountDataReceived = (
  action: UnknownAction,
): action is ReturnType<typeof accountDataReceived<AccountDataKind>> =>
  action.type === RECEIVED && hasKind(action.payload);

const isPrototypeKey = (key: string) => key === "__proto__" || key === "constructor";

function statusOf(state: AccountDataState, { kind, accountUUID, queryKey }: Target) {
  // Keys come from actions: one naming a prototype key writes into a status nobody reads.
  if ([kind, accountUUID, queryKey].some(isPrototypeKey)) return {};
  const byAccount = state[kind] ?? {};
  state[kind] = byAccount;
  const byQuery = byAccount[accountUUID] ?? {};
  byAccount[accountUUID] = byQuery;
  const status = byQuery[queryKey] ?? {};
  byQuery[queryKey] = status;
  return status;
}

const isCurrent = (status: AccountDataStatus, requestId: string) =>
  status.request?.id === requestId;

const initialState: AccountDataState = {};

export const accountDataSlice = createSlice({
  name: "accountData",
  initialState,
  reducers: {
    accountDataRequested: (state, { payload }: PayloadAction<AccountDataRequested>) => {
      const status = statusOf(state, payload);
      status.request = { id: payload.requestId, append: payload.append };
      status.error = undefined;
    },
    accountDataFailed: (state, { payload }: PayloadAction<AccountDataFailed>) => {
      const status = statusOf(state, payload);
      if (!isCurrent(status, payload.requestId)) return;
      status.request = undefined;
      status.error = payload.error;
    },
  },
  extraReducers: builder => {
    builder.addMatcher(isAnyAccountDataReceived, (state, { payload }) => {
      const status = statusOf(state, payload);
      if (!isCurrent(status, payload.requestId)) return;
      if (!payload.append) status.readAt = payload.readAt;
      status.request = undefined;
      status.error = undefined;
      status.sourceId = payload.sourceId;
      status.nextCursor = payload.nextCursor;
    });
  },
});

export const { accountDataRequested, accountDataFailed } = accountDataSlice.actions;

export function selectAccountDataStatus<K extends AccountDataKind>(
  state: AccountDataRootState,
  kind: K,
  accountUUID: AccountUUID,
  query?: AccountDataQuery<K>,
): AccountDataStatus | undefined {
  return state.accountData[kind]?.[accountUUID]?.[accountDataQueryKey(query)];
}
