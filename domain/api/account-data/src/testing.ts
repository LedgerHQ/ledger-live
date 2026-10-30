import { configureStore, createSlice } from "@reduxjs/toolkit";
import {
  AccountDataSourceIdSchema,
  accountDataQueryKey,
  accountDataSlice,
  isAccountDataReceived,
} from "@domain/entity-account-data";
import {
  computeAccountUUID,
  type AccountDescriptor,
  type AccountUUID,
} from "@domain/entity-account-descriptor";
import { accountDataExtra } from "./extra";
import type { AccountDataSource } from "./source";

// Toy kinds to test the framework without a real entity: `counter` in one read, `feed` paginated.

export type FeedQuery = { limit?: number; filter?: string };
export type FeedPage = { items: string[]; nextCursor?: string };

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    counter: { query: undefined; result: number };
    feed: { query: FeedQuery; result: FeedPage };
  }
}

const counterInitialState: Partial<Record<AccountUUID, number>> = {};

const counterSlice = createSlice({
  name: "counter",
  initialState: counterInitialState,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("counter"), (state, { payload }) => {
      state[payload.accountUUID] = payload.data;
    });
  },
});

/** By account, then by query: each query has its own window. */
type FeedState = Partial<Record<AccountUUID, Partial<Record<string, string[]>>>>;

const feedInitialState: FeedState = {};

const feedSlice = createSlice({
  name: "feed",
  initialState: feedInitialState,
  reducers: {},
  extraReducers: builder => {
    builder.addMatcher(isAccountDataReceived("feed"), (state, { payload }) => {
      const byQuery = state[payload.accountUUID] ?? {};
      const stored = payload.append ? (byQuery[payload.queryKey] ?? []) : [];
      byQuery[payload.queryKey] = [...stored, ...payload.data.items];
      state[payload.accountUUID] = byQuery;
    });
  },
});

/** The `feed` window of one account for one query. */
export const selectFeed = (
  state: { feed: FeedState },
  accountUUID: AccountUUID,
  query?: FeedQuery,
): string[] | undefined => state.feed[accountUUID]?.[accountDataQueryKey(query)];

/** A source id, for sources declared in tests. */
export const sourceIdOf = (id: string) => AccountDataSourceIdSchema.parse(id);

/** The `index`th toy account: address `0x<index>`, on `network` (ethereum by default). */
export const descriptorOf = (index: number, network = "ethereum"): AccountDescriptor => ({
  purpose: "account",
  version: "2",
  type: "address",
  network,
  address: `0x${index}`,
  path: `m/44h/60h/${index}h/0/0`,
});

/** The index a toy account was made with. */
export const indexOf = ({ descriptor }: { descriptor: AccountDescriptor }): number =>
  descriptor.type === "address" ? Number(descriptor.address.slice(2)) : Number.NaN;

export const descriptor = descriptorOf(0);

export const accountUUID: AccountUUID = computeAccountUUID(descriptor);

const toyReducer = {
  accountData: accountDataSlice.reducer,
  counter: counterSlice.reducer,
  feed: feedSlice.reducer,
};

/** A store holding both toy kinds and the status slice, with a router over `sources` in the thunk `extraArgument`. */
export function makeStore(sources: readonly AccountDataSource[], extra?: unknown) {
  return configureStore({
    reducer: toyReducer,
    middleware: getDefault =>
      getDefault({ thunk: { extraArgument: extra ?? accountDataExtra(sources) } }),
  });
}
