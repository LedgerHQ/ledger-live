import { configureStore, isAction, type Middleware } from "@reduxjs/toolkit";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { fromLegacyAccount } from "@ledgerhq/live-common/account/accountDescriptor";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { AccountIdSchema, accountsSlice } from "@domain/entity-account";
import {
  accountDataExtra,
  fetchAccountData,
  type AccountDataSource,
} from "@domain/api-account-data";
import { accountUUID, descriptor, sourceIdOf } from "@domain/api-account-data/testing";
import { accountDataRequested } from "@domain/entity-account-data";
import reducers from "~/renderer/reducers";
import { removeAccount, replaceAccounts } from "~/renderer/actions/accounts";
import { connectAccounts, type AccountDataObserver } from "./account-data-setup";
import type * as SetupModule from "./account-data-setup";

const mockReadCounter = jest.fn(async () => 5);
const mockReadBalance = jest.fn(async () => []);
jest.mock("@features/platform-account-source-coin-module", () => ({
  createCoinModuleSource: () => ({
    id: "coin-module",
    supports: () => true,
    read: { balance: () => mockReadBalance() },
  }),
}));
jest.mock("@ledgerhq/live-common/account-data/full-sync/createFullSyncSource", () => ({
  createFullSyncSource: () => ({
    id: "full-sync",
    supports: () => true,
    read: { counter: () => mockReadCounter() },
  }),
}));

const eth = genAccount("eth", { currency: getCryptoCurrencyById("ethereum") });
const polygon = genAccount("polygon", { currency: getCryptoCurrencyById("polygon") });

const { selectAccountEntries, selectAccountUUIDByLegacyId } = accountsSlice.getSelectors(
  (state: ReturnType<typeof reducers>) => state.accountEntries,
);

function setup() {
  const store = configureStore({
    reducer: reducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
  });
  connectAccounts(store);
  return store;
}

describe("connectAccounts", () => {
  it("keeps one descriptor per legacy account through import and delete", () => {
    const store = setup();
    store.dispatch({ type: "INIT_ACCOUNTS", payload: { accounts: [eth], accountsUserData: [] } });
    expect(selectAccountUUIDByLegacyId(store.getState(), AccountIdSchema.parse(eth.id))).toBe(
      computeAccountUUID(fromLegacyAccount(eth)),
    );

    store.dispatch(replaceAccounts([eth, polygon]));
    expect(selectAccountEntries(store.getState())).toHaveLength(2);

    store.dispatch(removeAccount(eth));
    expect(
      selectAccountUUIDByLegacyId(store.getState(), AccountIdSchema.parse(eth.id)),
    ).toBeUndefined();
    expect(selectAccountUUIDByLegacyId(store.getState(), AccountIdSchema.parse(polygon.id))).toBe(
      computeAccountUUID(fromLegacyAccount(polygon)),
    );
  });
});

/** An observer recording the action types it sees, whose sources all read 7. */
function fakeObserver() {
  const actions: string[] = [];
  const middleware: Middleware = () => next => action => {
    if (isAction(action)) actions.push(action.type);
    return next(action);
  };
  const instrument = jest.fn<
    ReturnType<AccountDataObserver["instrument"]>,
    Parameters<AccountDataObserver["instrument"]>
  >(sources => sources.map(source => ({ ...source, read: { counter: async () => 7 } })));
  return { actions, observer: { middleware, instrument } };
}

const COIN_MODULE = 0;
const FULL_SYNC = 1;

const readCounter = (sources: readonly AccountDataSource[], index: number) =>
  sources[index].read?.counter?.({ accountUUID, descriptor }, undefined);

const readBalance = (sources: readonly AccountDataSource[]) =>
  sources[COIN_MODULE].read?.balance?.({ accountUUID, descriptor }, undefined);

describe("accountDataTaps", () => {
  let taps: typeof SetupModule;

  beforeEach(() => {
    mockReadCounter.mockClear();
    mockReadBalance.mockClear();
    jest.isolateModules(() => {
      taps = jest.requireActual<typeof SetupModule>("./account-data-setup");
    });
  });

  function setupStore() {
    const sources = taps.accountDataSources(
      () => store.getState(),
      action => store.dispatch(action),
    );
    const store = configureStore({
      reducer: reducers,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          serializableCheck: false,
          immutableCheck: false,
          thunk: { extraArgument: accountDataExtra(sources) },
        }).concat(taps.accountDataTaps.middleware),
    });
    return { store, sources };
  }

  it("passes actions and reads through unchanged before an observer plugs in", async () => {
    const { store, sources } = setupStore();
    const action = { type: "TEST_ACTION" };

    expect(store.dispatch(action)).toBe(action);
    await expect(readBalance(sources)).resolves.toEqual([]);
    await expect(readCounter(sources, FULL_SYNC)).resolves.toBe(5);
    await store.dispatch(fetchAccountData("counter", descriptor));
    expect(mockReadBalance).toHaveBeenCalledTimes(1);
    expect(mockReadCounter).toHaveBeenCalledTimes(2);
  });

  it("hands actions to the observer and reads to its instrumented sources once observed", async () => {
    const { store, sources } = setupStore();
    const { actions, observer } = fakeObserver();

    taps.accountDataTaps.observe(observer);
    store.dispatch({ type: "TEST_ACTION" });
    await expect(readCounter(sources, COIN_MODULE)).resolves.toBe(7);
    await expect(readCounter(sources, FULL_SYNC)).resolves.toBe(7);
    await store.dispatch(fetchAccountData("counter", descriptor));

    expect(actions).toContain("TEST_ACTION");
    expect(actions).toContain(accountDataRequested.type);
    expect(observer.instrument).toHaveBeenCalledTimes(1);
    expect(observer.instrument.mock.calls[0][0].map(({ id }) => id)).toEqual([
      sourceIdOf("coin-module"),
      sourceIdOf("full-sync"),
    ]);
    expect(mockReadBalance).not.toHaveBeenCalled();
    expect(mockReadCounter).not.toHaveBeenCalled();
  });

  it("ignores a second observer", async () => {
    const { store, sources } = setupStore();
    const first = fakeObserver();
    const second = fakeObserver();

    taps.accountDataTaps.observe(first.observer);
    taps.accountDataTaps.observe(second.observer);
    store.dispatch({ type: "TEST_ACTION" });
    await readCounter(sources, FULL_SYNC);

    expect(first.actions).toEqual(["TEST_ACTION"]);
    expect(second.actions).toEqual([]);
    expect(second.observer.instrument).not.toHaveBeenCalled();
  });
});
