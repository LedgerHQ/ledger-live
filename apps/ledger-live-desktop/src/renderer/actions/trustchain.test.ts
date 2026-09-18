import {
  TRUSTCHAIN_STORE_VERSION,
  trustchainStorageKey,
  trustchainStoreActionTypePrefix,
  type TrustchainStore,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { initMemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/utils";
import { getKey } from "~/renderer/storage";
import { fetchTrustchain } from "./trustchain";

jest.mock("~/renderer/storage", () => ({
  getKey: jest.fn(),
}));

describe("fetchTrustchain", () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should dispatch the persisted trustchain records", async () => {
    const PROD: TrustchainStore = {
      trustchain: {
        rootId: "prod-root-id",
        walletSyncEncryptionKey: "prod-wallet-sync-encryption-key",
        applicationPath: "m/0'/16'/0'",
      },
      memberCredentials: initMemberCredentials(),
    };
    const STAGING: TrustchainStore = {
      version: TRUSTCHAIN_STORE_VERSION,
      trustchain: {
        rootId: "staging-root-id",
        walletSyncEncryptionKey: "staging-wallet-sync-encryption-key",
        applicationPath: "m/0'/16'/1'",
      },
      memberCredentials: initMemberCredentials(),
    };
    jest.mocked(getKey).mockImplementation((_namespace, key) => {
      return Promise.resolve(key === trustchainStorageKey.PROD ? PROD : STAGING);
    });

    await fetchTrustchain()(dispatch, jest.fn(), undefined);

    expect(getKey).toHaveBeenCalledWith("app", trustchainStorageKey.PROD);
    expect(getKey).toHaveBeenCalledWith("app", trustchainStorageKey.STAGING, null);
    expect(dispatch).toHaveBeenCalledWith({
      type: `${trustchainStoreActionTypePrefix}IMPORT_STATE`,
      payload: { PROD, STAGING },
    });
  });

  it("should initialize PROD and leave STAGING absent when storage is missing", async () => {
    jest.mocked(getKey).mockResolvedValue(undefined);

    await fetchTrustchain()(dispatch, jest.fn(), undefined);

    expect(dispatch).toHaveBeenCalledWith({
      type: `${trustchainStoreActionTypePrefix}IMPORT_STATE`,
      payload: {
        PROD: {
          version: TRUSTCHAIN_STORE_VERSION,
          trustchain: null,
          memberCredentials: {
            pubkey: expect.stringMatching(/^[0-9a-f]+$/),
            privatekey: expect.stringMatching(/^[0-9a-f]+$/),
          },
        },
        STAGING: null,
      },
    });
  });

  it("should not dispatch while either trustchain record is encrypted", async () => {
    jest.mocked(getKey).mockImplementation((_namespace, key) => {
      return Promise.resolve(
        key === trustchainStorageKey.PROD
          ? ("6a9f1c...ciphertext..." as unknown as TrustchainStore)
          : null,
      );
    });

    await fetchTrustchain()(dispatch, jest.fn(), undefined);

    expect(getKey).toHaveBeenCalledTimes(2);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
