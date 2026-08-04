import { importTrustchainStoreState, resetTrustchainStore, trustchainHandlers } from "../../store";
import type { MemberCredentials } from "../../types";

describe("trustchain store", () => {
  it("should initialize member credentials when importing missing trustchain state", () => {
    const action = importTrustchainStoreState();

    expect(action.payload.trustchain).toEqual({
      trustchain: null,
      memberCredentials: {
        pubkey: expect.stringMatching(/^[0-9a-f]+$/),
        privatekey: expect.stringMatching(/^[0-9a-f]+$/),
      },
    });
  });

  it("should reset the trustchain when imported state has no member credentials", () => {
    const action = importTrustchainStoreState({
      trustchain: {
        rootId: "root-id",
        walletSyncEncryptionKey: "wallet-sync-encryption-key",
        applicationPath: "m/0'/16'/0'",
      },
      memberCredentials: null,
    });

    expect(action.payload.trustchain).toEqual({
      trustchain: null,
      memberCredentials: {
        pubkey: expect.stringMatching(/^[0-9a-f]+$/),
        privatekey: expect.stringMatching(/^[0-9a-f]+$/),
      },
    });
  });

  it("should preserve persisted state with valid member credentials", () => {
    const persistedState = {
      trustchain: null,
      memberCredentials: {
        pubkey: "02e3311a12c450604725f02d1a775ef5cdb4a1b832eb41ac6b1302adbe92a612fc",
        privatekey: "873f500bd20783224f7e78d4f8cce3d2bf69eb8008fbd697d20bbea31a721a03",
      },
    };

    expect(importTrustchainStoreState(persistedState).payload.trustchain).toBe(persistedState);
  });

  it("should regenerate credentials and clear the trustchain when persisted credentials are invalid", () => {
    const action = importTrustchainStoreState({
      trustchain: {
        rootId: "root-id",
        walletSyncEncryptionKey: "wallet-sync-encryption-key",
        applicationPath: "m/0'/16'/0'",
      },
      memberCredentials: {} as MemberCredentials,
    });

    expect(action.payload.trustchain).toEqual({
      trustchain: null,
      memberCredentials: {
        pubkey: expect.stringMatching(/^[0-9a-f]+$/),
        privatekey: expect.stringMatching(/^[0-9a-f]+$/),
      },
    });
  });

  it("should deterministically reset the trustchain with fresh member credentials", () => {
    const previousState = {
      trustchain: {
        rootId: "root-id",
        walletSyncEncryptionKey: "wallet-sync-encryption-key",
        applicationPath: "m/0'/16'/0'",
      },
      memberCredentials: {
        pubkey: "persisted-pubkey",
        privatekey: "persisted-privatekey",
      },
    };
    const action = resetTrustchainStore();
    const resetState = trustchainHandlers.TRUSTCHAIN_STORE_RESET(previousState, action);

    expect(resetState).toEqual({
      trustchain: null,
      memberCredentials: {
        pubkey: expect.stringMatching(/^[0-9a-f]+$/),
        privatekey: expect.stringMatching(/^[0-9a-f]+$/),
      },
    });
    expect(resetState.memberCredentials).not.toEqual(previousState.memberCredentials);
    expect(trustchainHandlers.TRUSTCHAIN_STORE_RESET(previousState, action)).toEqual(resetState);
  });
});
