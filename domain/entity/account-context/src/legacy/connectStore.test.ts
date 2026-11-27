import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AccountUUID } from "@domain/entity-account";
import { computeAccountUUID } from "@domain/entity-account/schema.mock";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import type { AccountContext } from "../schema";
import { accountContextReceived, accountContextSlice, selectAccountContext } from "../slice";
import { connectAccountContextsStore } from "./connectStore";

type LegacyAccount = { id: string; viewKey?: string; broken?: boolean; sameUUIDAs?: string };

const legacy = createSlice({
  name: "accounts",
  initialState: [] as LegacyAccount[],
  reducers: {
    replaceAccounts: (_, { payload }: PayloadAction<LegacyAccount[]>) => payload,
  },
});
const { replaceAccounts } = legacy.actions;

const uuids = new Map<string, AccountUUID>();
const uuidOf = (id: string): AccountUUID => {
  const known = uuids.get(id);
  if (known) return known;
  const key = `0x${(uuids.size + 1).toString(16).padStart(40, "0")}`;
  const uuid = computeAccountUUID(mockAddressAccountDescriptor({ key }));
  uuids.set(id, uuid);
  return uuid;
};

const aleo: LegacyAccount = { id: "aleo-1", viewKey: "AViewKey1first" };
const otherAleo: LegacyAccount = { id: "aleo-2", viewKey: "AViewKey1second" };
const ethereum: LegacyAccount = { id: "eth-1" };

function setup(initial: LegacyAccount[] = []) {
  const store = configureStore({
    reducer: {
      accounts: legacy.reducer,
      [accountContextSlice.reducerPath]: accountContextSlice.reducer,
    },
    preloadedState: { accounts: initial },
  });
  const dispatch = jest.spyOn(store, "dispatch");
  const onError = jest.fn();
  const toAccountUUID = jest.fn((account: LegacyAccount) => {
    if (account.broken) throw new Error("no descriptor");
    return uuidOf(account.sameUUIDAs ?? account.id);
  });
  const disconnect = connectAccountContextsStore(store, {
    selectLegacyAccounts: state => state.accounts,
    toAccountUUID,
    toContext: ({ viewKey }): AccountContext | undefined => (viewKey ? { viewKey } : undefined),
    onError,
  });
  const contextOf = (account: LegacyAccount) =>
    selectAccountContext(store.getState(), uuidOf(account.id));
  return { store, dispatch, onError, toAccountUUID, disconnect, contextOf };
}

describe("connectAccountContextsStore", () => {
  it("mirrors the contexts the legacy accounts hold at connection", () => {
    const { contextOf } = setup([aleo, ethereum]);
    expect(contextOf(aleo)).toEqual({ viewKey: "AViewKey1first" });
    expect(contextOf(ethereum)).toBeUndefined();
  });

  it("mirrors an account added later, and drops the context of a removed one", () => {
    const { store, contextOf } = setup([aleo]);
    store.dispatch(replaceAccounts([aleo, otherAleo]));
    expect(contextOf(otherAleo)).toEqual({ viewKey: "AViewKey1second" });
    store.dispatch(replaceAccounts([otherAleo]));
    expect(contextOf(aleo)).toBeUndefined();
    expect(contextOf(otherAleo)).toEqual({ viewKey: "AViewKey1second" });
  });

  it("keeps the context of an account the store does not hold, as completion writes it", () => {
    const { store } = setup([aleo]);
    const candidate = uuidOf("candidate");
    store.dispatch(accountContextReceived({ accountUUID: candidate, context: { viewKey: "k" } }));
    store.dispatch(replaceAccounts([]));
    expect(selectAccountContext(store.getState(), candidate)).toEqual({ viewKey: "k" });
  });

  it("converts each account once and dispatches nothing when no context changes", () => {
    const { store, dispatch, toAccountUUID } = setup([aleo, ethereum]);
    dispatch.mockClear();
    store.dispatch(replaceAccounts([{ ...aleo }, ethereum]));
    store.dispatch(replaceAccounts([ethereum, aleo]));
    expect(toAccountUUID).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual([
      replaceAccounts.type,
      replaceAccounts.type,
    ]);
  });

  it("keeps the last context of two legacy ids on one UUID, through a reorder and a removal", () => {
    const twin: LegacyAccount = {
      id: "aleo-1-twin",
      sameUUIDAs: aleo.id,
      viewKey: "AViewKey1twin",
    };
    const { store, contextOf } = setup([aleo, twin]);
    expect(contextOf(aleo)).toEqual({ viewKey: "AViewKey1twin" });
    store.dispatch(replaceAccounts([twin, aleo]));
    expect(contextOf(aleo)).toEqual({ viewKey: "AViewKey1first" });
    store.dispatch(replaceAccounts([twin]));
    expect(contextOf(aleo)).toEqual({ viewKey: "AViewKey1twin" });
    store.dispatch(replaceAccounts([]));
    expect(contextOf(aleo)).toBeUndefined();
  });

  it("leaves out an account it cannot convert, reports it once, and retries it once it changes", () => {
    const broken = { ...aleo, broken: true };
    const { store, onError, contextOf } = setup([broken]);
    store.dispatch(replaceAccounts([broken, ethereum]));
    expect(onError).toHaveBeenCalledTimes(1);
    expect(contextOf(aleo)).toBeUndefined();
    store.dispatch(replaceAccounts([aleo, ethereum]));
    expect(contextOf(aleo)).toEqual({ viewKey: "AViewKey1first" });
  });

  it("stops mirroring once disconnected", () => {
    const { store, disconnect, contextOf } = setup([]);
    disconnect();
    store.dispatch(replaceAccounts([aleo]));
    expect(contextOf(aleo)).toBeUndefined();
  });
});
