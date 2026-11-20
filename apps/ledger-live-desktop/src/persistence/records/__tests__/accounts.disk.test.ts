import fs from "fs";
import os from "os";
import path from "path";
import { configureStore } from "@reduxjs/toolkit";
import { createPersistence } from "@features/platform-persistence";
import { createElectronStorage } from "@shared/storage-electron";
import rootReducer, { type State } from "~/renderer/reducers";
import { initAccounts } from "~/renderer/actions/accounts";
import { accountsRecord } from "../accounts";
import { legacyAccountsExport, legacyAccountsTransform } from "./legacyAccountsTransform";

type MainDb = typeof import("~/main/db").default;

const FIXTURE = path.resolve(__dirname, "../../../../tests/userdata/1AccountBTC1AccountETH.json");
const PASSWORD = "a password";

let directory: string;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "accounts-disk-"));
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

async function openMainDb(folder: string): Promise<MainDb> {
  jest.resetModules();
  const db: MainDb = (await import("~/main/db")).default;
  db.init(folder);
  return db;
}

function copyFixtureTo(name: string): string {
  const folder = path.join(directory, name);
  fs.mkdirSync(folder);
  fs.copyFileSync(FIXTURE, path.join(folder, "app.json"));
  return folder;
}

const readFile = (folder: string) =>
  JSON.parse(fs.readFileSync(path.join(folder, "app.json"), "utf-8")).data;

const settle = async () => {
  for (let tick = 0; tick < 50; tick++) await Promise.resolve();
};

const createStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: getDefault => getDefault({ serializableCheck: false, immutableCheck: false }),
  });

const raiseFirstBalance = {
  type: "UPDATE_ACCOUNT",
  payload: {
    accountId: "",
    updater: (account: State["accounts"][number]) => ({
      ...account,
      balance: account.balance.plus(1),
    }),
  },
};

async function writeWithLegacy(folder: string, password?: string) {
  const db = await openMainDb(folder);
  if (password) await db.setEncryptionKey(password);
  const store = createStore();
  store.dispatch(
    initAccounts((await legacyAccountsTransform.get(await db.getKey("app", "accounts"))) ?? []),
  );
  const [first] = store.getState().accounts;
  store.dispatch({
    ...raiseFirstBalance,
    payload: { ...raiseFirstBalance.payload, accountId: first.id },
  });
  await db.setKey(
    "app",
    "accounts",
    await legacyAccountsTransform.set(legacyAccountsExport(store.getState())),
  );
  await db.flush();
}

async function writeWithPersistence(folder: string, password?: string) {
  const db = await openMainDb(folder);
  const storage = createElectronStorage({
    bridge: { getKey: db.getKey, setKey: db.setKey },
    encryptedKeys: ["accounts"],
  });
  const bindings = [{ record: accountsRecord }];
  const report = jest.fn();
  const persistence = createPersistence<State>({ storage, bindings, report });
  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefault =>
      getDefault({ serializableCheck: false, immutableCheck: false }).concat(
        persistence.middleware,
      ),
  });
  const hydrate = (keys?: string[]) => persistence.hydrate(store, { keys });

  const statuses = [await hydrate()];
  if (password) {
    await db.setEncryptionKey(password);
    statuses.push(await hydrate(["accounts"]));
  }
  const [first] = store.getState().accounts;
  store.dispatch({
    ...raiseFirstBalance,
    payload: { ...raiseFirstBalance.payload, accountId: first.id },
  });
  await settle();
  await persistence.flush();
  // setKey resolves once main holds the value; the file is saved after its debounce.
  await db.flush();
  return { statuses, failures: report.mock.calls };
}

async function encryptFixture(folder: string) {
  const db = await openMainDb(folder);
  await db.setEncryptionKey(PASSWORD);
  await db.setKey("app", "accounts", await db.getKey("app", "accounts"));
  await db.flush();
}

async function decryptedAccounts(folder: string) {
  const db = await openMainDb(folder);
  await db.setEncryptionKey(PASSWORD);
  return db.getKey("app", "accounts");
}

describe("the accounts write to app.json, through the real main db", () => {
  it("gives the same plain file as the legacy path", async () => {
    const legacyFolder = copyFixtureTo("legacy");
    const persistenceFolder = copyFixtureTo("persistence");
    const before = readFile(persistenceFolder);

    await writeWithLegacy(legacyFolder);
    const { statuses, failures } = await writeWithPersistence(persistenceFolder);

    expect(statuses).toEqual([{ accounts: "loaded" }]);
    expect(failures).toEqual([]);

    expect(readFile(persistenceFolder)).not.toEqual(before);
    expect(readFile(persistenceFolder)).toEqual(readFile(legacyFolder));
    expect((readFile(persistenceFolder).accounts as Array<{ version: number }>)[0].version).toBe(3);
  });

  it("gives the same encrypted accounts as the legacy path, from a locked start", async () => {
    const legacyFolder = copyFixtureTo("legacy");
    const persistenceFolder = copyFixtureTo("persistence");
    await encryptFixture(legacyFolder);
    await encryptFixture(persistenceFolder);
    expect(typeof readFile(persistenceFolder).accounts).toBe("string");

    await writeWithLegacy(legacyFolder, PASSWORD);
    const encryptedBefore = readFile(persistenceFolder).accounts;
    const { statuses, failures } = await writeWithPersistence(persistenceFolder, PASSWORD);

    expect(statuses).toEqual([{ accounts: "locked" }, { accounts: "loaded" }]);
    expect(failures).toEqual([]);

    expect(readFile(persistenceFolder).accounts).not.toBe(encryptedBefore);
    expect(typeof readFile(persistenceFolder).accounts).toBe("string");
    expect(await decryptedAccounts(persistenceFolder)).toEqual(
      await decryptedAccounts(legacyFolder),
    );
  });
});
