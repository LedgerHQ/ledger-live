import { configureStore } from "@reduxjs/toolkit";
import { selectRecordStatus } from "@features/platform-persistence";
import {
  trustchainStoreSelector,
  type TrustchainStore,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { initMemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/utils";
import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { db } from "~/renderer/bridge";
import logger from "~/renderer/logger";
import accountModel from "~/helpers/accountModel";
import rootReducer from "~/renderer/reducers";
import { accountNameSelector, exportWalletState } from "~/renderer/reducers/wallet";
import { hydrateAtStart, hydrateEncryptedState, persistence } from "../composition";
import { initialState as walletInitialState } from "~/renderer/reducers/wallet.core";

const createStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: getDefault =>
      getDefault({ serializableCheck: false, immutableCheck: false }).concat(
        persistence.middleware,
      ),
  });

const stored = (values: Record<string, unknown>, { failsOnce }: { failsOnce?: string } = {}) => {
  let failed = false;
  return jest.mocked(db.getKey).mockImplementation(async (_ns, key) => {
    if (key === failsOnce && !failed) {
      failed = true;
      throw new Error(`${key} read failed`);
    }
    return values[key];
  });
};

const readsOf = (key: string) =>
  jest.mocked(db.getKey).mock.calls.filter(([, readKey]) => readKey === key).length;

const storedTrustchain: TrustchainStore = {
  trustchain: {
    rootId: "root-id",
    walletSyncEncryptionKey: "wallet-sync-encryption-key",
    applicationPath: "m/0'/16'/0'",
  },
  memberCredentials: initMemberCredentials(),
};

const ACCOUNT_RAW = {
  id: "js:2:bitcoin:xpub:native_segwit",
  seedIdentifier: "seed",
  derivationMode: "native_segwit",
  index: 0,
  freshAddress: "bc1q",
  freshAddressPath: "84'/0'/0'/0/0",
  name: "Bitcoin 1",
  blockHeight: 0,
  currencyId: "bitcoin",
  operations: [],
  pendingOperations: [],
  lastSyncDate: "",
  balance: "0",
} as unknown as AccountRaw;

const walletNaming = (accountId: string, name: string, version = 0) => ({
  ...exportWalletState({ wallet: walletInitialState, contacts: [] } as never),
  walletSyncState: { data: null, version },
  accountsData: { accountNames: [[accountId, name]] },
});

describe("hydrateEncryptedState", () => {
  afterEach(() => jest.mocked(db.getKey).mockReset());

  it("should throw while the accounts are still encrypted", async () => {
    stored({ accounts: "ciphertext", wallet: "ciphertext", trustchain: "ciphertext" });
    const store = createStore();

    await expect(hydrateEncryptedState(store)).rejects.toThrow(
      expect.objectContaining({ name: "EncryptedRecordsStillLockedError" }),
    );
    expect(selectRecordStatus(store.getState(), "accounts")).toBe("locked");
  });

  it("should read the accounts again on the next try when they could not be read", async () => {
    stored({ accounts: { not: "a list" } });
    const store = createStore();

    await expect(hydrateEncryptedState(store)).rejects.toThrow(
      expect.objectContaining({ name: "AccountsUnreadableError" }),
    );
    expect(selectRecordStatus(store.getState(), "accounts")).toBe("failed");

    stored({ accounts: [] });
    await expect(hydrateEncryptedState(store)).resolves.toBeUndefined();
    expect(selectRecordStatus(store.getState(), "accounts")).toBe("loaded");
  });

  it("should read the trustchain again, not the accounts, when its first read fails", async () => {
    stored({ accounts: [], trustchain: storedTrustchain }, { failsOnce: "trustchain" });
    const store = createStore();

    await expect(hydrateEncryptedState(store)).rejects.toThrow("trustchain read failed");
    expect(selectRecordStatus(store.getState(), "accounts")).toBe("loaded");

    await expect(hydrateEncryptedState(store)).resolves.toBeUndefined();
    expect(trustchainStoreSelector(store.getState()).trustchain).toEqual(
      storedTrustchain.trustchain,
    );
    expect(readsOf("accounts")).toBe(1);
  });

  it("should import the wallet again, not read the accounts, when its first import fails", async () => {
    const [account] = (await accountModel.decode({ data: ACCOUNT_RAW, version: 3 })) as [
      Account,
      unknown,
    ];
    const values: Record<string, unknown> = {
      accounts: [{ data: ACCOUNT_RAW, version: 3 }],
      wallet: {
        walletSyncState: { data: null, version: 0 },
        accountsData: { accountNames: "not a list" },
      },
    };
    stored(values);
    const store = createStore();

    await expect(hydrateEncryptedState(store)).rejects.toThrow(TypeError);

    values.wallet = walletNaming(account.id, "From the wallet", 7);
    await expect(hydrateEncryptedState(store)).resolves.toBeUndefined();
    expect(accountNameSelector(store.getState().wallet, { accountId: account.id })).toBe(
      "From the wallet",
    );
    expect(store.getState().wallet.walletSync.walletSyncState).toEqual({ data: null, version: 7 });
    expect(readsOf("accounts")).toBe(1);
  });

  it("should read nothing on a later unlock once all of it is loaded", async () => {
    stored({ accounts: [], trustchain: storedTrustchain });
    const store = createStore();
    await hydrateEncryptedState(store);
    jest.mocked(db.getKey).mockClear();

    await expect(hydrateEncryptedState(store)).resolves.toBeUndefined();

    expect(db.getKey).not.toHaveBeenCalled();
  });

  it("should read nothing when the start loaded all of it, with no password", async () => {
    stored({ accounts: [], trustchain: storedTrustchain });
    const store = createStore();
    await hydrateAtStart(store);
    jest.mocked(db.getKey).mockClear();

    await expect(hydrateEncryptedState(store)).resolves.toBeUndefined();

    expect(db.getKey).not.toHaveBeenCalled();
  });
});

describe("hydrateAtStart", () => {
  afterEach(() => jest.mocked(db.getKey).mockReset());

  it("loads the wallet names over the copy saved with each account (LIVE-41517)", async () => {
    const [account] = (await accountModel.decode({ data: ACCOUNT_RAW, version: 3 })) as [
      Account,
      unknown,
    ];
    stored({
      accounts: [{ data: ACCOUNT_RAW, version: 3 }],
      wallet: walletNaming(account.id, "From the wallet"),
    });
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

describe("the persistence report", () => {
  beforeEach(() => {
    jest.spyOn(logger, "warn").mockImplementation(() => {});
    jest.spyOn(logger, "critical").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.mocked(db.getKey).mockReset();
    jest.restoreAllMocks();
  });

  it("should warn, not report a critical error, when an account comes from a newer app", async () => {
    const newer = { $v: 1, data: { data: { id: "newer", currencyId: "bitcoin" }, version: 3 } };
    stored({ accounts: [newer] });

    await expect(hydrateAtStart(createStore())).resolves.toEqual({
      accounts: "loaded",
      history: "empty",
    });

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("newer version"));
    expect(logger.critical).not.toHaveBeenCalled();
  });

  it("should report a critical error when the accounts cannot be decoded", async () => {
    stored({ accounts: { not: "a list" } });

    await expect(hydrateAtStart(createStore())).rejects.toThrow(
      expect.objectContaining({ name: "AccountsUnreadableError" }),
    );

    expect(logger.critical).toHaveBeenCalledWith(
      expect.objectContaining({ name: "PersistenceFailureError" }),
      "persistence",
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
