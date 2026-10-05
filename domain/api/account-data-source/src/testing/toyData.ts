import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { AccountRefSchema, type AccountId, type AccountRef } from "@domain/entity-account";
import type { AccountDataBinding, AccountDataReceived } from "@domain/entity-account-data";
import { createAccountDataRouter } from "../router";
import type { AccountDataSource } from "../source";

// Two datums that exist only in this package's tests, so the framework is tested without any real
// `@domain/entity-account-*`: `counter` is read in one go, `feed` one page at a time.

export type FeedQuery = { cursor?: string; limit?: number };
export type FeedPage = { items: string[]; nextCursor?: string };

declare module "@domain/entity-account-data" {
  interface AccountData {
    counter: { query: undefined; result: number };
    feed: { query: FeedQuery; result: FeedPage };
  }
}

type Status = { pending: boolean; error?: string; sourceId?: string };
type Entry<T> = { value: T; at: string };
type ToyState<T> = { byAccount: Record<AccountId, Entry<T>>; status: Record<AccountId, Status> };

const requested = (state: ToyState<unknown>, { payload }: PayloadAction<AccountId>) => {
  state.status[payload] = { pending: true, sourceId: state.status[payload]?.sourceId };
};
const failed = (
  state: ToyState<unknown>,
  { payload }: PayloadAction<{ accountId: AccountId; error: string }>,
) => {
  state.status[payload.accountId] = {
    pending: false,
    error: payload.error,
    sourceId: state.status[payload.accountId]?.sourceId,
  };
};

const counterSlice = createSlice({
  name: "counter",
  initialState: { byAccount: {}, status: {} } as ToyState<number>,
  reducers: {
    requested,
    failed,
    received: (state, { payload }: PayloadAction<AccountDataReceived<"counter">>) => {
      state.byAccount[payload.accountId] = { value: payload.data, at: payload.at };
      state.status[payload.accountId] = { pending: false, sourceId: payload.sourceId };
    },
  },
});

const feedSlice = createSlice({
  name: "feed",
  initialState: { byAccount: {}, status: {} } as ToyState<FeedPage>,
  reducers: {
    requested,
    failed,
    received: (state, { payload }: PayloadAction<AccountDataReceived<"feed">>) => {
      const previous = state.byAccount[payload.accountId];
      const items =
        payload.append && previous
          ? [...previous.value.items, ...payload.data.items]
          : payload.data.items;
      state.byAccount[payload.accountId] = {
        value: {
          items,
          ...(payload.data.nextCursor ? { nextCursor: payload.data.nextCursor } : {}),
        },
        at: payload.append && previous ? previous.at : payload.at,
      };
      state.status[payload.accountId] = { pending: false, sourceId: payload.sourceId };
    },
  },
});

export type ToyRootState = { counter: ToyState<number>; feed: ToyState<FeedPage> };

const at = (entry: Entry<unknown> | undefined) => (entry ? Date.parse(entry.at) : undefined);

export const counterBinding: AccountDataBinding<"counter", ToyRootState> = {
  datum: "counter",
  requested: counterSlice.actions.requested,
  received: counterSlice.actions.received,
  failed: counterSlice.actions.failed,
  selectAt: (state, id) => at(state.counter.byAccount[id]),
  selectPending: (state, id) => state.counter.status[id]?.pending ?? false,
  selectSourceId: (state, id) => state.counter.status[id]?.sourceId,
};

export const feedBinding: AccountDataBinding<"feed", ToyRootState> = {
  datum: "feed",
  requested: feedSlice.actions.requested,
  received: feedSlice.actions.received,
  failed: feedSlice.actions.failed,
  selectAt: (state, id) => at(state.feed.byAccount[id]),
  selectPending: (state, id) => state.feed.status[id]?.pending ?? false,
  selectSourceId: (state, id) => state.feed.status[id]?.sourceId,
  selectNextQuery: (state, id) => {
    const cursor = state.feed.byAccount[id]?.value.nextCursor;
    return cursor === undefined ? undefined : { cursor };
  },
};

export const ref: AccountRef = AccountRefSchema.parse({
  accountId: "js:2:ethereum:0xabc:",
  currencyId: "ethereum",
  address: "0xabc",
  derivationMode: "",
});

/** A store holding both toy datums, with a router over `sources` in the thunk extraArgument. */
export function makeStore(sources: AccountDataSource[], extra?: unknown) {
  return configureStore({
    reducer: { counter: counterSlice.reducer, feed: feedSlice.reducer },
    middleware: getDefault =>
      getDefault({
        thunk: { extraArgument: extra ?? { accountData: createAccountDataRouter(sources) } },
      }),
  });
}
