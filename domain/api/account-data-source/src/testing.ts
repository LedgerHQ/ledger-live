import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  AccountDataBinding,
  AccountDataFailed,
  AccountDataReceived,
} from "@domain/entity-account-data";
import {
  computeAccountUUID,
  type AccountDescriptor,
  type AccountUUID,
} from "@domain/entity-account-descriptor";
import { accountDataExtra } from "./extra";
import type { AccountDataSource } from "./source";

// Toy kinds to test the framework without a real entity: `counter` in one read, `feed` paginated.

export type FeedQuery = { cursor?: string; limit?: number };
export type FeedPage = { items: string[]; nextCursor?: string };

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    counter: { query: undefined; result: number };
    feed: { query: FeedQuery; result: FeedPage };
  }
}

type Status = { pending: boolean; error?: string; sourceId?: string };
type Entry<T> = { value: T; at: string };
type ToyState<T> = {
  byAccount: Record<AccountUUID, Entry<T>>;
  status: Record<AccountUUID, Status>;
};

const requested = (state: ToyState<unknown>, { payload }: PayloadAction<AccountUUID>) => {
  state.status[payload] = { pending: true, sourceId: state.status[payload]?.sourceId };
};

const failed = (state: ToyState<unknown>, { payload }: PayloadAction<AccountDataFailed>) => {
  state.status[payload.accountUUID] = {
    pending: false,
    error: payload.error,
    sourceId: state.status[payload.accountUUID]?.sourceId,
  };
};

const counterSlice = createSlice({
  name: "counter",
  initialState: { byAccount: {}, status: {} } as ToyState<number>,
  reducers: {
    requested,
    failed,
    received: (state, { payload }: PayloadAction<AccountDataReceived<"counter">>) => {
      state.byAccount[payload.accountUUID] = { value: payload.data, at: payload.at };
      state.status[payload.accountUUID] = { pending: false, sourceId: payload.sourceId };
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
      const previous = state.byAccount[payload.accountUUID];
      const appending = payload.append && previous !== undefined;
      state.byAccount[payload.accountUUID] = {
        value: {
          items: appending ? [...previous.value.items, ...payload.data.items] : payload.data.items,
          ...(payload.data.nextCursor === undefined ? {} : { nextCursor: payload.data.nextCursor }),
        },
        at: appending ? previous.at : payload.at,
      };
      state.status[payload.accountUUID] = { pending: false, sourceId: payload.sourceId };
    },
  },
});

export type ToyRootState = { counter: ToyState<number>; feed: ToyState<FeedPage> };

const at = (entry: Entry<unknown> | undefined) => (entry ? Date.parse(entry.at) : undefined);

export const counterBinding: AccountDataBinding<"counter", ToyRootState> = {
  kind: "counter",
  requested: counterSlice.actions.requested,
  received: counterSlice.actions.received,
  failed: counterSlice.actions.failed,
  selectAt: (state, id) => at(state.counter.byAccount[id]),
  selectPending: (state, id) => state.counter.status[id]?.pending ?? false,
  selectSourceId: (state, id) => state.counter.status[id]?.sourceId,
};

export const feedBinding: AccountDataBinding<"feed", ToyRootState> = {
  kind: "feed",
  requested: feedSlice.actions.requested,
  received: feedSlice.actions.received,
  failed: feedSlice.actions.failed,
  selectAt: (state, id) => at(state.feed.byAccount[id]),
  selectPending: (state, id) => state.feed.status[id]?.pending ?? false,
  selectSourceId: (state, id) => state.feed.status[id]?.sourceId,
  selectNextQuery: (state, id, query) => {
    const cursor = state.feed.byAccount[id]?.value.nextCursor;
    return cursor === undefined ? undefined : { ...query, cursor };
  },
};

/** The `index`th toy account: address `0x<index>`, on `network` (ethereum by default). */
export const descriptorOf = (index: number, network = "ethereum"): AccountDescriptor => ({
  purpose: "account",
  version: "1",
  type: "address",
  network: { name: network, env: "main" },
  address: `0x${index}`,
  path: `m/44h/60h/${index}h/0/0`,
});

/** The index a toy account was made with. */
export const indexOf = ({ descriptor }: { descriptor: AccountDescriptor }): number =>
  descriptor.type === "address" ? Number(descriptor.address.slice(2)) : Number.NaN;

export const descriptor = descriptorOf(0);

export const accountUUID: AccountUUID = computeAccountUUID(descriptor);

/** A store holding both toy kinds, with a router over `sources` in the thunk `extraArgument`. */
export function makeStore(sources: readonly AccountDataSource[], extra?: unknown) {
  return configureStore({
    reducer: { counter: counterSlice.reducer, feed: feedSlice.reducer },
    middleware: getDefault =>
      getDefault({ thunk: { extraArgument: extra ?? accountDataExtra(sources) } }),
  });
}
