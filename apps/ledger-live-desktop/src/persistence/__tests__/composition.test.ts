import { configureStore } from "@reduxjs/toolkit";
import { selectRecordStatus } from "@features/platform-persistence";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { db } from "~/renderer/bridge";
import accountModel from "~/helpers/accountModel";
import rootReducer from "~/renderer/reducers";
import { accountNameSelector, exportWalletState } from "~/renderer/reducers/wallet";
import {
  encryptedRecordsLoaded,
  hydrateAtStart,
  hydrateEncryptedRecords,
  persistence,
} from "../composition";
import { initialState as walletInitialState } from "~/renderer/reducers/wallet.core";

const createStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: getDefault =>
      getDefault({ serializableCheck: false, immutableCheck: false }).concat(
        persistence.middleware,
      ),
  });

const stored = (values: Record<string, unknown>) =>
  jest.mocked(db.getKey).mockImplementation(async (_ns, key) => values[key]);

describe("hydrateEncryptedRecords", () => {
  afterEach(() => jest.mocked(db.getKey).mockReset());

  it("throws while the accounts are still encrypted", async () => {
    stored({ accounts: "ciphertext", wallet: "ciphertext" });
    const store = createStore();

    await expect(hydrateEncryptedRecords(store)).rejects.toThrow(
      expect.objectContaining({ name: "EncryptedRecordsStillLockedError" }),
    );
    expect(selectRecordStatus(store.getState(), "accounts")).toBe("locked");
  });

  it("throws when the accounts cannot be read", async () => {
    stored({ accounts: { not: "a list" } });
    const store = createStore();

    await expect(hydrateEncryptedRecords(store)).rejects.toThrow(
      expect.objectContaining({ name: "AccountsUnreadableError" }),
    );
    expect(selectRecordStatus(store.getState(), "accounts")).toBe("failed");
  });

  it("resolves with an empty list", async () => {
    stored({ accounts: [] });
    const store = createStore();

    await expect(hydrateEncryptedRecords(store)).resolves.toBeUndefined();
    expect(selectRecordStatus(store.getState(), "accounts")).toBe("loaded");
  });
});

describe("encryptedRecordsLoaded", () => {
  afterEach(() => jest.mocked(db.getKey).mockReset());

  it("stays false after a failed try, so the next unlock reads the accounts again", async () => {
    const store = createStore();
    expect(encryptedRecordsLoaded(store.getState())).toBe(false);

    stored({ accounts: { not: "a list" } });
    await expect(hydrateEncryptedRecords(store)).rejects.toThrow(
      expect.objectContaining({ name: "AccountsUnreadableError" }),
    );
    expect(encryptedRecordsLoaded(store.getState())).toBe(false);

    stored({ accounts: [] });
    await hydrateEncryptedRecords(store);
    expect(encryptedRecordsLoaded(store.getState())).toBe(true);
  });
});

describe("hydrateAtStart", () => {
  afterEach(() => jest.mocked(db.getKey).mockReset());

  it("loads the wallet names over the copy saved with each account (LIVE-41517)", async () => {
    const raw = {
      id: "js:2:bitcoin:xpub:native_segwit",
      seedIdentifier: "seed",
      derivationMode: "native_segwit",
      index: 0,
      freshAddress: "bc1q",
      freshAddressPath: "84'/0'/0'/0/0",
      name: "Bitcoin 1",
      starred: false,
      blockHeight: 0,
      currencyId: "bitcoin",
      operations: [],
      pendingOperations: [],
      lastSyncDate: "",
      balance: "0",
    } as unknown as AccountRaw;
    const [account] = (await accountModel.decode({ data: raw, version: 3 })) as [Account, unknown];
    const wallet = {
      ...exportWalletState({ wallet: walletInitialState, contacts: [] } as never),
      walletSyncState: { data: null, version: 0 },
      accountsData: { accountNames: [[account.id, "From the wallet"]], starredAccountIds: [] },
    };
    stored({ accounts: [{ data: raw, version: 3 }], wallet });
    const store = createStore();

    await expect(hydrateAtStart(store)).resolves.toEqual({
      accounts: "loaded",
      history: "empty",
    });

    expect(accountNameSelector(store.getState().wallet, { accountId: account.id })).toBe(
      "From the wallet",
    );
  });
});
