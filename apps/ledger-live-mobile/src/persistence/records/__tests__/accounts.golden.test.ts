import { combineReducers, configureStore } from "@reduxjs/toolkit";
import type { Account, AccountRaw, DerivationMode } from "@ledgerhq/types-live";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  createPersistence,
  keyPerEntry,
  persistenceSlice,
  selectRecordStatus,
  type PersistenceBinding,
} from "@features/platform-persistence";
import { ACCOUNTS_VERSION_LINE } from "@features/platform-persistence-accounts";
import { createMemoryStorage, type ListableStoragePort } from "@shared/storage";
import { deleteAccount, importStore, updateAccountWithUpdater } from "~/actions/accounts";
import accountModel from "~/logic/accountModel";
import accounts, { exportSelector } from "~/reducers/accounts";
import wallet, {
  INITIAL_STATE as WALLET_INITIAL_STATE,
  accountUserDataExportSelector,
} from "~/reducers/wallet";
import { accountsRecord } from "../accounts";

const rootReducer = combineReducers({
  accounts,
  wallet,
  persistence: persistenceSlice.reducer,
});
type TestState = ReturnType<typeof rootReducer>;

const PREFIX = "accounts.active.";
const ORDER_KEY = "accounts.sort";

const bindings: PersistenceBinding<TestState>[] = [
  { record: accountsRecord, keyScheme: keyPerEntry({ prefix: PREFIX, orderKey: ORDER_KEY }) },
];

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

async function storedEntry(account: Account, version = 1) {
  const userData = accountUserDataExportSelector(WALLET_INITIAL_STATE, { account });
  const { data } = await accountModel.encode([account, userData]);
  return { data, version };
}

const settle = async () => {
  for (let tick = 0; tick < 50; tick++) await Promise.resolve();
};

function createStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: getDefault => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
}

function setup(
  stored: Record<string, unknown>,
  storage: ListableStoragePort = createMemoryStorage(stored),
) {
  const report = jest.fn();
  const persistence = createPersistence<TestState>({ storage, bindings, report });
  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefault =>
      getDefault({ serializableCheck: false, immutableCheck: false }).concat(
        persistence.middleware,
      ),
  });
  const hydrate = () => persistence.hydrate(store);
  const set = jest.spyOn(storage, "set");
  const remove = jest.spyOn(storage, "remove");
  return { store, storage, report, hydrate, persistence, set, remove };
}

async function legacyImport(active: Array<{ data: AccountRaw; version?: number }>) {
  const store = createStore();
  (await importStore({ active }))(store.dispatch);
  return store.getState();
}

const ids = (state: TestState) => state.accounts.active.map(account => account.id);

describe("mobile accounts on persistence", () => {
  const first = genAccount("mobile-golden-a", { currency: bitcoin, operationsSize: 3 });
  const second = genAccount("mobile-golden-b", { currency: ethereum, operationsSize: 3 });
  const orphan = genAccount("mobile-golden-c", { currency: bitcoin, operationsSize: 1 });

  let entries: Record<string, { data: AccountRaw; version: number }>;

  beforeAll(async () => {
    entries = {
      first: await storedEntry(first),
      second: await storedEntry(second),
      orphan: await storedEntry(orphan),
    };
  });

  it("uses the mobile model, which has all the steps of the line but the first", () => {
    expect(accountModel.version).toBe(ACCOUNTS_VERSION_LINE.length - 1);
  });

  it("hydrates to the same state as the legacy importStore", async () => {
    const { store, hydrate, report } = setup({
      [PREFIX + first.id]: entries.first,
      [PREFIX + second.id]: entries.second,
      [ORDER_KEY]: [first.id, second.id],
    });

    await hydrate();

    const legacy = await legacyImport([entries.first, entries.second]);
    expect(selectRecordStatus(store.getState(), "accounts")).toBe("loaded");
    expect(store.getState().accounts).toEqual(legacy.accounts);
    expect(store.getState().wallet).toEqual(legacy.wallet);
    expect(report).not.toHaveBeenCalled();
  });

  it.each([
    ["a legacy 1 runs all the steps", 1, "44'/637'/0'/0'/0'"],
    ["the model version runs no step", accountModel.version, "44'/637'/0'/0/0"],
  ])(
    "runs the steps from the stored version, as importStore does: %s",
    async (_, version, path) => {
      const aptos = genAccount("mobile-golden-aptos", { currency: getCryptoCurrencyById("aptos") });
      const { data } = await storedEntry(aptos);
      const stored = { data: { ...data, freshAddressPath: "44'/637'/0'/0/0" }, version };
      const { store, hydrate } = setup({ [PREFIX + aptos.id]: stored, [ORDER_KEY]: [aptos.id] });

      await hydrate();

      const legacy = await legacyImport([stored]);
      expect(store.getState().accounts.active.map(account => account.freshAddressPath)).toEqual([
        path,
      ]);
      expect(store.getState().accounts).toEqual(legacy.accounts);
    },
  );

  it("runs all the steps for an account with no version, as importStore does", async () => {
    const aptos = genAccount("mobile-golden-aptos-none", {
      currency: getCryptoCurrencyById("aptos"),
    });
    const { data } = await storedEntry(aptos);
    const stored = { data: { ...data, freshAddressPath: "44'/637'/0'/0/0" } };
    const { store, hydrate, report, set } = setup({
      [PREFIX + aptos.id]: stored,
      [ORDER_KEY]: [aptos.id],
    });

    await hydrate();
    await settle();

    const legacy = await legacyImport([stored]);
    expect(report).not.toHaveBeenCalled();
    expect(store.getState().accounts.active.map(account => account.freshAddressPath)).toEqual([
      "44'/637'/0'/0'/0'",
    ]);
    expect(store.getState().accounts).toEqual(legacy.accounts);
    expect(set).not.toHaveBeenCalled();
  });

  it("loads a key missing from the order first, as the legacy read does", async () => {
    const { store, hydrate } = setup({
      [PREFIX + first.id]: entries.first,
      [PREFIX + second.id]: entries.second,
      [PREFIX + orphan.id]: entries.orphan,
      [ORDER_KEY]: [second.id, first.id],
    });

    await hydrate();

    expect(ids(store.getState())).toEqual([orphan.id, second.id, first.id]);
  });

  it("keeps an entry it cannot read: reported by index, not loaded, never removed", async () => {
    const storage = createMemoryStorage({
      [PREFIX + first.id]: entries.first,
      [PREFIX + second.id]: entries.second,
      [ORDER_KEY]: [first.id, second.id],
    });
    const get = storage.get.bind(storage);
    storage.get = jest.fn(async (key: string) => {
      if (key === PREFIX + second.id) throw new SyntaxError("Unexpected token in JSON");
      return get(key);
    });
    const { store, hydrate, report } = setup({}, storage);

    await hydrate();
    store.dispatch(deleteAccount(first));
    await settle();

    expect(ids(store.getState())).toEqual([]);
    expect(report).toHaveBeenCalledWith({
      key: "accounts",
      version: 0,
      operation: "read",
      reason: "SyntaxError",
      entry: 1,
    });
    await expect(storage.keys(PREFIX)).resolves.toEqual([PREFIX + second.id]);
  });

  it("drops an account with an unsupported derivation mode, as importStore does, but keeps its key", async () => {
    const unsupported = {
      data: {
        ...entries.second.data,
        derivationMode: "unsupported_derivation_mode" as DerivationMode,
      },
      version: 1,
    };
    const { store, storage, hydrate } = setup({
      [PREFIX + first.id]: entries.first,
      [PREFIX + second.id]: unsupported,
      [ORDER_KEY]: [first.id, second.id],
    });

    await hydrate();
    const legacy = await legacyImport([entries.first, unsupported]);
    expect(ids(store.getState())).toEqual(ids(legacy));

    store.dispatch(deleteAccount(first));
    await settle();
    await expect(storage.keys(PREFIX)).resolves.toEqual([PREFIX + second.id]);
    await expect(storage.get(PREFIX + second.id)).resolves.toEqual(unsupported);
  });

  it("writes only the changed account, with the data and the version of the legacy save", async () => {
    const { store, storage, hydrate, set } = setup({
      [PREFIX + first.id]: entries.first,
      [PREFIX + second.id]: entries.second,
      [ORDER_KEY]: [first.id, second.id],
    });
    await hydrate();

    store.dispatch(
      updateAccountWithUpdater({
        accountId: first.id,
        updater: account => ({ ...account, balance: account.balance.plus(1) }),
      }),
    );
    await settle();

    expect(set.mock.calls.map(([key]) => key)).toEqual([PREFIX + first.id, ORDER_KEY]);
    const legacySave = await exportSelector(store.getState() as never);
    const legacyFirst = legacySave.active.find(({ data }) => data.id === first.id);
    expect(legacyFirst?.version).toBe(accountModel.version);
    await expect(storage.get(PREFIX + first.id)).resolves.toEqual({
      data: JSON.parse(JSON.stringify(legacyFirst?.data)),
      version: legacyFirst?.version,
    });
    await expect(storage.get(ORDER_KEY)).resolves.toEqual([first.id, second.id]);
  });

  it("removes the key of a deleted account, and keeps the keys that do not decode", async () => {
    const broken = { data: { id: "broken" }, version: 1 };
    const newer = { ...entries.orphan, version: 4 };
    const { store, storage, hydrate } = setup({
      [PREFIX + first.id]: entries.first,
      [PREFIX + second.id]: entries.second,
      [`${PREFIX}broken`]: broken,
      [PREFIX + orphan.id]: newer,
      [ORDER_KEY]: [first.id, second.id, "broken", orphan.id],
    });
    await hydrate();

    store.dispatch(deleteAccount(second));
    await settle();

    expect(selectRecordStatus(store.getState(), "accounts")).toBe("loaded");
    expect([...(await storage.keys(PREFIX))].sort()).toEqual(
      [PREFIX + first.id, `${PREFIX}broken`, PREFIX + orphan.id].sort(),
    );
    await expect(storage.get(`${PREFIX}broken`)).resolves.toEqual(broken);
    await expect(storage.get(PREFIX + orphan.id)).resolves.toEqual(newer);
    await expect(storage.get(ORDER_KEY)).resolves.toEqual([first.id]);
  });

  it("does not write a change that the legacy save ignores", async () => {
    const { store, hydrate, set } = setup({
      [PREFIX + first.id]: entries.first,
      [ORDER_KEY]: [first.id],
    });
    await hydrate();

    store.dispatch(
      updateAccountWithUpdater({
        accountId: first.id,
        updater: account => ({ ...account, lastSyncDate: new Date(0) }),
      }),
    );
    await settle();

    expect(set).not.toHaveBeenCalled();
  });

  it("does not write the accounts it just hydrated", async () => {
    const { hydrate, set } = setup({
      [PREFIX + first.id]: entries.first,
      [ORDER_KEY]: [first.id],
    });
    await hydrate();
    await settle();
    expect(set).not.toHaveBeenCalled();
  });
});
