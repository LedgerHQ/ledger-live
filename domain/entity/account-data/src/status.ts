import { createSlice, type PayloadAction, type UnknownAction } from "@reduxjs/toolkit";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { AccountDataKind, AccountDataResult } from "./registry";
import type { AccountDataSourceId } from "./sourceId";

export type AccountDataError = { name: string; message: string };

/** The read in flight: a head read (`append: false`) or a next page. */
export type AccountDataRequest = { id: string; queryKey: string; append: boolean };

/** How the reads of one kind of one account went. The data itself lives in the entity's slice. */
export type AccountDataStatus = {
  request?: AccountDataRequest;
  /** Of the last read, cleared by the next answer. */
  error?: AccountDataError;
  /** The source that answered the stored data: only it can serve its next page. */
  sourceId?: AccountDataSourceId;
  /** The query of the stored head, as `accountDataQueryKey` writes it. */
  queryKey?: string;
  /** When the stored head was read, in ms since epoch. */
  readAt?: number;
  /** Where the stored data continues, at its source; absent at the end or on a kind without pages. */
  nextCursor?: string;
};

/** By kind, then by account. Keyed by string, so the shape holds whatever kinds the registry has. */
export type AccountDataState = Partial<
  Record<string, Partial<Record<AccountUUID, AccountDataStatus>>>
>;

export type AccountDataRootState = { accountData: AccountDataState };

type Target = { kind: AccountDataKind; accountUUID: AccountUUID; requestId: string };

export type AccountDataRequested = Target & { queryKey: string; append: boolean };

export type AccountDataFailed = Target & { error: AccountDataError };

export type AccountDataReceived<K extends AccountDataKind> = {
  kind: K;
  accountUUID: AccountUUID;
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

function statusOf(state: AccountDataState, kind: string, accountUUID: AccountUUID) {
  // Keys come from actions: one naming a prototype key writes into a status nobody reads.
  if (kind === "__proto__" || kind === "constructor" || accountUUID === "__proto__") return {};
  const byAccount = state[kind] ?? {};
  state[kind] = byAccount;
  const status = byAccount[accountUUID] ?? {};
  byAccount[accountUUID] = status;
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
      const { kind, accountUUID, requestId: id, queryKey, append } = payload;
      const status = statusOf(state, kind, accountUUID);
      status.request = { id, queryKey, append };
      status.error = undefined;
    },
    accountDataFailed: (state, { payload }: PayloadAction<AccountDataFailed>) => {
      const status = statusOf(state, payload.kind, payload.accountUUID);
      if (!isCurrent(status, payload.requestId)) return;
      status.request = undefined;
      status.error = payload.error;
    },
  },
  extraReducers: builder => {
    builder.addMatcher(isAnyAccountDataReceived, (state, { payload }) => {
      const status = statusOf(state, payload.kind, payload.accountUUID);
      if (!isCurrent(status, payload.requestId)) return;
      if (!payload.append) {
        status.queryKey = status.request?.queryKey;
        status.readAt = payload.readAt;
      }
      status.request = undefined;
      status.error = undefined;
      status.sourceId = payload.sourceId;
      status.nextCursor = payload.nextCursor;
    });
  },
});

export const { accountDataRequested, accountDataFailed } = accountDataSlice.actions;

export function selectAccountDataStatus(
  state: AccountDataRootState,
  kind: AccountDataKind,
  accountUUID: AccountUUID,
): AccountDataStatus | undefined {
  return state.accountData[kind]?.[accountUUID];
}
