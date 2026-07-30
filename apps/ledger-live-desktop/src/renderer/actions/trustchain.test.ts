import type { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { trustchainStoreActionTypePrefix } from "@ledgerhq/ledger-key-ring-protocol/store";
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

  it("should dispatch the persisted trustchain state", async () => {
    const persistedTrustchainStore: TrustchainStore = {
      trustchain: {
        rootId: "root-id",
        walletSyncEncryptionKey: "wallet-sync-encryption-key",
        applicationPath: "m/0'/16'/0'",
      },
      memberCredentials: initMemberCredentials(),
    };
    jest.mocked(getKey).mockResolvedValue(persistedTrustchainStore);

    await fetchTrustchain()(dispatch, jest.fn(), undefined);

    expect(getKey).toHaveBeenCalledWith("app", "trustchain");
    expect(dispatch).toHaveBeenCalledWith({
      type: `${trustchainStoreActionTypePrefix}IMPORT_STATE`,
      payload: { trustchain: persistedTrustchainStore },
    });
  });

  it("should dispatch a default trustchain state when storage is missing", async () => {
    jest.mocked(getKey).mockResolvedValue(undefined);

    await fetchTrustchain()(dispatch, jest.fn(), undefined);

    expect(dispatch).toHaveBeenCalledWith({
      type: `${trustchainStoreActionTypePrefix}IMPORT_STATE`,
      payload: {
        trustchain: {
          trustchain: null,
          memberCredentials: {
            pubkey: expect.stringMatching(/^[0-9a-f]+$/),
            privatekey: expect.stringMatching(/^[0-9a-f]+$/),
          },
        },
      },
    });
  });
});
