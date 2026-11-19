import fs from "fs";
import path from "path";
import { configureStore } from "@reduxjs/toolkit";
import {
  createPersistence,
  selectRecordStatus,
  type PersistenceFailure,
} from "@features/platform-persistence";
import { ACCOUNTS_VERSION_LINE } from "@features/platform-persistence-accounts";
import { encodeEntries } from "@shared/persistence";
import { createMemoryStorage, StorageLockedError, type StoragePort } from "@shared/storage";
import type { AccountRaw } from "@ledgerhq/types-live";
import accountModel from "~/helpers/accountModel";
import rootReducer, { type State } from "~/renderer/reducers";
import { initAccounts, updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { accountsRecord } from "../accounts";
import { legacyAccountsExport, legacyAccountsTransform } from "./legacyAccountsTransform";

type StoredEntry = { data: AccountRaw; version: number };

const DESKTOP_USERDATA = path.resolve(__dirname, "../../../../tests/userdata");
const E2E_USERDATA = path.resolve(__dirname, "../../../../../../e2e/desktop/tests/userdata");

const readAppJson = (filePath: string): { data: { accounts?: unknown } } =>
  JSON.parse(fs.readFileSync(filePath, "utf-8"));

const userdataFiles = [DESKTOP_USERDATA, E2E_USERDATA].flatMap(directory =>
  fs
    .readdirSync(directory)
    .filter(file => file.endsWith(".json"))
    .map(file => [
      path.relative(path.resolve(directory, "../.."), path.join(directory, file)),
      path.join(directory, file),
    ]),
);

const storedAccountsOf = (file: string): StoredEntry[] => {
  const accounts = readAppJson(file).data.accounts;
  return Array.isArray(accounts) ? accounts : [];
};

const flushWrites = async () => {
  for (let tick = 0; tick < 50; tick++) await Promise.resolve();
};

function createStore(storage: StoragePort) {
  const failures: PersistenceFailure[] = [];
  const report = (failure: PersistenceFailure) => failures.push(failure);
  const persistence = createPersistence<State>({
    storage,
    bindings: [{ record: accountsRecord }],
    report,
  });
  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefault =>
      getDefault({ serializableCheck: false, immutableCheck: false }).concat(
        persistence.middleware,
      ),
  });
  const hydrate = () => persistence.hydrate(store);
  return { store, failures, hydrate };
}

async function loadWithLegacy(stored: unknown) {
  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefault => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
  const decoded = await legacyAccountsTransform.get(stored);
  store.dispatch(initAccounts(decoded ?? []));
  return store.getState();
}

async function hydrateStored(stored: unknown) {
  const storage = createMemoryStorage(stored === undefined ? {} : { accounts: stored });
  const { store, failures, hydrate } = createStore(storage);
  const statuses = await hydrate();
  return { state: store.getState(), statuses, failures, store, storage };
}

const legacyStoredBytes = async (state: State) =>
  JSON.stringify(await legacyAccountsTransform.set(legacyAccountsExport(state)));

const persistedBytes = async (state: State) =>
  JSON.stringify(
    await encodeEntries(accountsRecord.codec, accountsRecord.state.select(state), state),
  );

describe.each(userdataFiles)("the userdata fixture %s", (_name, file) => {
  it("loads the same accounts, names and starred ids as the legacy code", async () => {
    const stored = storedAccountsOf(file);
    const legacy = await loadWithLegacy(stored);
    const { state, failures } = await hydrateStored(stored);

    expect(state.accounts).toEqual(legacy.accounts);
    expect(state.wallet).toEqual(legacy.wallet);
    expect(failures.length).toBe(stored.length - legacy.accounts.length);
  });

  it("encodes the same bytes as the legacy code", async () => {
    const { state } = await hydrateStored(storedAccountsOf(file));
    expect(await persistedBytes(state)).toBe(await legacyStoredBytes(state));
  });
});

const ETH_FIXTURE = path.join(DESKTOP_USERDATA, "1AccountBTC1AccountETH.json");
const ethereumEntry = (): StoredEntry => {
  const entry = storedAccountsOf(ETH_FIXTURE).find(
    account => account.data.currencyId === "ethereum",
  );
  if (!entry) throw new Error("the fixture has no ethereum account");
  return entry;
};

describe("stored versions", () => {
  it("uses the desktop model, which has all the steps of the line", () => {
    expect(accountModel.version).toBe(ACCOUNTS_VERSION_LINE.length);
  });

  it("migrates a v0 entry with the 2018 ethereumjs id, as the legacy code does", async () => {
    const { data } = ethereumEntry();
    const address = data.freshAddress;
    const v0: StoredEntry = {
      version: 0,
      data: { ...data, id: `ethereumjs:2:ethereum:${address}:`, freshAddressPath: "44'/60'/0'/0" },
    };

    const legacy = await loadWithLegacy([v0]);
    const { state, statuses } = await hydrateStored([v0]);

    expect(statuses.accounts).toBe("loaded");
    expect(state.accounts.map(account => account.id)).toEqual(
      legacy.accounts.map(account => account.id),
    );
    expect(state.accounts[0]?.id).toMatch(/^ethereumjs:2:ethereum:.*:ethM$/);
  });

  it("round-trips a v3 entry byte for byte", async () => {
    const legacy = await loadWithLegacy([ethereumEntry()]);
    const v3 = JSON.parse(await legacyStoredBytes(legacy));
    expect(v3[0].version).toBe(3);

    const { state } = await hydrateStored(v3);

    expect(await persistedBytes(state)).toBe(JSON.stringify(v3));
  });

  it("keeps a v4 entry stored, as it is, and loads the others", async () => {
    const [bitcoin] = storedAccountsOf(ETH_FIXTURE);
    const v4 = { ...ethereumEntry(), version: 4 };
    const { state, statuses, failures, store, storage } = await hydrateStored([bitcoin, v4]);

    store.dispatch({ type: "REPLACE_ACCOUNTS", payload: [] });
    await flushWrites();

    expect(statuses.accounts).toBe("loaded");
    expect(state.accounts.map(account => account.id)).toEqual([bitcoin.data.id]);
    expect(failures).toEqual([
      expect.objectContaining({ key: "accounts", operation: "decode", entry: 1 }),
    ]);
    await expect(storage.get("accounts")).resolves.toEqual([v4]);
  });
});

describe("bad stored accounts", () => {
  const BAD = path.join(DESKTOP_USERDATA, "skip-onboarding-with-bad-account-data.json");

  it("reports each account it cannot decode by index, with no id and no value", async () => {
    const { failures } = await hydrateStored(storedAccountsOf(BAD));
    expect(failures).toEqual([
      { key: "accounts", version: 0, operation: "decode", reason: expect.any(String), entry: 0 },
      { key: "accounts", version: 0, operation: "decode", reason: expect.any(String), entry: 1 },
    ]);
    expect(JSON.stringify(failures)).not.toMatch(
      /INVALID_CURRENCY_ID|1x1g9m7sH8D2gTfQFiVVKB7kmUF3B/,
    );
  });

  it("keeps the bad accounts stored at the next write; the legacy code removed them", async () => {
    const bad = storedAccountsOf(BAD);
    const good = storedAccountsOf(ETH_FIXTURE);
    const { store, storage } = await hydrateStored([...bad, ...good]);
    const [first] = store.getState().accounts;

    store.dispatch(
      updateAccountWithUpdater(first.id, account => ({
        ...account,
        balance: account.balance.plus(1),
      })),
    );
    await flushWrites();

    const written = (await storage.get("accounts")) as StoredEntry[];
    expect(written.map(entry => entry.data.id)).toEqual(
      [...good, ...bad].map(entry => entry.data.id),
    );
    expect(written.slice(good.length)).toEqual(bad);
  });
});

describe("writes", () => {
  it("writes the legacy shape when an account changes", async () => {
    const { store, storage } = await hydrateStored(storedAccountsOf(ETH_FIXTURE));
    const [first] = store.getState().accounts;

    store.dispatch(
      updateAccountWithUpdater(first.id, account => ({
        ...account,
        balance: account.balance.plus(1),
      })),
    );
    await flushWrites();

    const written = await storage.get("accounts");
    expect(JSON.stringify(written)).toBe(await legacyStoredBytes(store.getState()));
  });

  it("does not write when no account changes", async () => {
    const storage = createMemoryStorage({ accounts: storedAccountsOf(ETH_FIXTURE) });
    const set = jest.spyOn(storage, "set");
    const { store, hydrate } = createStore(storage);
    await hydrate();

    store.dispatch({
      type: "UPDATE_ACCOUNT",
      payload: { accountId: "unknown", updater: (a: unknown) => a },
    });
    await flushWrites();

    expect(set).not.toHaveBeenCalled();
  });
});

describe("a password-locked app", () => {
  it("is locked, then loads after the unlock", async () => {
    const storage = createMemoryStorage({ accounts: storedAccountsOf(ETH_FIXTURE) });
    const get = storage.get.bind(storage);
    let locked = true;
    storage.get = async key => {
      if (locked && key === "accounts") throw new StorageLockedError(key);
      return get(key);
    };
    const { store, hydrate } = createStore(storage);

    await expect(hydrate()).resolves.toEqual({ accounts: "locked" });
    expect(store.getState().accounts).toEqual([]);

    locked = false;
    await expect(hydrate()).resolves.toEqual({ accounts: "loaded" });
    expect(selectRecordStatus(store.getState(), "accounts")).toBe("loaded");
    expect(store.getState().accounts.length).toBeGreaterThan(0);
  });
});
