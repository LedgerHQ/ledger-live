import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useWatchWalletSync } from "../hooks/useWatchWalletSync";
import {
  INSTANCES,
  lldWalletSyncFeatureFlag,
  mockedSdk,
  simpleTrustChain,
  walletSyncActivatedState,
} from "./shared";

const INITIAL_STATE = {
  walletSync: {
    ...walletSyncActivatedState,
    instances: INSTANCES,
  },
  trustchain: {
    trustchain: simpleTrustChain,
    memberCredentials: {
      pubkey: "currentInstance",
      privatekey: "privatekey",
    },
  },
  ...withFlagOverrides(lldWalletSyncFeatureFlag),
};

jest.mock("../hooks/useTrustchainSdk", () => ({
  useTrustchainSdk: () => ({
    getMembers: (mockedSdk.getMembers = jest.fn()),
    removeMember: (mockedSdk.removeMember = jest.fn()),
    initMemberCredentials: (mockedSdk.initMemberCredentials = jest.fn()),
  }),
}));

describe("useWatchWalletSync", () => {
  it("should not run ledger sync watch loop when ff is disabled", async () => {
    const { result, store } = renderHook(() => useWatchWalletSync(), {});

    expect(store.getState().featureFlags.overrides.lldWalletSync).not.toBeDefined();
    expect(result.current.visualPending).toBe(false);
    expect(result.current.walletSyncError).toBe(null);
    expect(result.current.onUserRefresh).toBeInstanceOf(Function);
    expect(result.current.onUserRefresh).not.toThrow();
  });

  it("should run ledger sync watch loop when ff is enabled", async () => {
    const { result, store } = renderHook(() => useWatchWalletSync(), {
      initialState: INITIAL_STATE,
    });

    expect(store.getState().featureFlags.overrides.lldWalletSync?.enabled).toBe(true);
    expect(result.current.visualPending).toBe(true);
    expect(result.current.walletSyncError).toBe(null);
  });
});
