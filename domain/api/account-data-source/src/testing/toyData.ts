import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AccountId } from "@domain/entity-account";
import { computeAccountId } from "@domain/entity-account-alias";
import { accountKeyOf, type AccountDescriptor } from "@domain/entity-account-descriptor";
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

export const descriptor: AccountDescriptor = {
  purpose: "account",
  version: "1",
  type: "address",
  network: { name: "ethereum", env: "main" },
  address: "0xabc",
  path: "m/44h/60h/0h/0/0",
};

/** The `index`th toy account: its address is `0x<index>`, on `network` (ethereum by default). */
export const descriptorOf = (index: number, network = "ethereum"): AccountDescriptor => ({
  purpose: "account",
  version: "1",
  type: "address",
  network: { name: network, env: "main" },
  address: `0x${index}`,
  path: `m/44h/60h/${index}h/0/0`,
});

/** The index a toy account was made with. */
export const indexOf = ({ descriptor }: { descriptor: AccountDescriptor }) =>
  Number(accountKeyOf(descriptor).slice(2));

/** The id the toy slices key `descriptor` by. */
export const accountId: AccountId = computeAccountId(descriptor);

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
