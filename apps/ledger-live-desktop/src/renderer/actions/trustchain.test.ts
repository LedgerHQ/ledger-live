import { isKeyRingAction } from "@domain/entity-key-ring";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";
import type { KeyRingPersistedState } from "@features/platform-key-ring";
import { getKey } from "~/renderer/storage";
import { fetchTrustchain } from "./trustchain";

jest.mock("~/renderer/storage", () => ({
  getKey: jest.fn(),
}));

describe("fetchTrustchain", () => {
  const dispatch = jest.fn();

  function importedKeyRingStates(): unknown[] {
    return dispatch.mock.calls
      .map(([action]) => action)
      .filter(isKeyRingAction)
      .map(action => action.payload);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    dispatch.mockImplementation(action =>
      typeof action === "function" ? action(dispatch) : action,
    );
  });

  it("should dispatch the persisted trustchain state", async () => {
    const persistedTrustchainStore = mockKeyRingState({
      trustchain: {
        rootId: "root-id",
        walletSyncEncryptionKey: "wallet-sync-encryption-key",
        applicationPath: "m/0'/16'/0'",
      },
    });
    jest.mocked(getKey).mockResolvedValue(persistedTrustchainStore);

    await fetchTrustchain()(dispatch, jest.fn(), undefined);

    expect(getKey).toHaveBeenCalledWith("app", "trustchain");
    expect(importedKeyRingStates()).toEqual([persistedTrustchainStore]);
  });

  it("should dispatch a default trustchain state when storage is missing", async () => {
    jest.mocked(getKey).mockResolvedValue(undefined);

    await fetchTrustchain()(dispatch, jest.fn(), undefined);

    expect(importedKeyRingStates()).toEqual([
      {
        trustchain: null,
        memberCredentials: {
          pubkey: expect.stringMatching(/^[0-9a-f]+$/),
          privatekey: expect.stringMatching(/^[0-9a-f]+$/),
        },
      },
    ]);
  });

  it("should not dispatch when storage returns an encrypted string (app is password-locked)", async () => {
    jest
      .mocked(getKey)
      .mockResolvedValue("6a9f1c...ciphertext..." as unknown as KeyRingPersistedState);

    await fetchTrustchain()(dispatch, jest.fn(), undefined);

    expect(getKey).toHaveBeenCalledWith("app", "trustchain");
    expect(dispatch).not.toHaveBeenCalled();
  });
});
