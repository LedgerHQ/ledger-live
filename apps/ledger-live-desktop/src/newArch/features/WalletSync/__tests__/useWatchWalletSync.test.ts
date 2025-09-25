import React from "react";
import { renderHook } from "tests/testSetup";
import { INITIAL_STATE as INITIAL_STATE_SETTINGS } from "~/renderer/reducers/settings";
import { useWalletSyncDesktop } from "../hooks/useWalletSyncDesktop";
import {
  INSTANCES,
  lldWalletSyncFeatureFlag,
  mockedSdk,
  simpleTrustChain,
  walletSyncActivatedState,
} from "./shared";
import { useWatchWalletSync } from "@ledgerhq/live-wallet-sync-react";

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const mockUseWatchWalletSync = useWatchWalletSync as jest.MockedFunction<typeof useWatchWalletSync>;

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
  settings: {
    ...INITIAL_STATE_SETTINGS,
    overriddenFeatureFlags: lldWalletSyncFeatureFlag,
  },
};

jest.mock("../hooks/useTrustchainSdk", () => ({
  useTrustchainSdk: () => ({
    getMembers: (mockedSdk.getMembers = jest.fn()),
    removeMember: (mockedSdk.removeMember = jest.fn()),
    initMemberCredentials: (mockedSdk.initMemberCredentials = jest.fn()),
  }),
}));

jest.mock("@ledgerhq/live-wallet-sync-react", () => ({
  useWatchWalletSync: jest.fn(() => ({
    visualPending: false,
    walletSyncError: null,
    onUserRefresh: jest.fn(),
  })),
  WalletSyncProvider: ({ children }: { children: React.ReactNode }) => children,
  useWalletSyncBridgeContext: jest.fn(),
}));

describe("useWalletSyncDesktop", () => {
  beforeEach(() => {
    mockUseWatchWalletSync.mockReturnValue({
      visualPending: false,
      walletSyncError: null,
      onUserRefresh: jest.fn(),
    });
  });

  it("should not run ledger sync watch loop when ff is disabled", async () => {
    const { result, store } = renderHook(() => useWalletSyncDesktop(), {});

    expect(store.getState().settings.overriddenFeatureFlags.lldWalletSync).not.toBeDefined();
    expect(result.current.visualPending).toBe(false);
    expect(result.current.walletSyncError).toBe(null);
    expect(typeof result.current.onUserRefresh).toBe("function");
    expect(result.current.onUserRefresh).not.toThrow();
  });

  it("should run ledger sync watch loop when ff is enabled", async () => {
    // Update mock for this test case
    mockUseWatchWalletSync.mockReturnValue({
      visualPending: true,
      walletSyncError: null,
      onUserRefresh: jest.fn(),
    });

    const { result, store } = renderHook(() => useWalletSyncDesktop(), {
      initialState: INITIAL_STATE,
    });

    expect(store.getState().settings.overriddenFeatureFlags.lldWalletSync.enabled).toBe(true);
    expect(result.current.visualPending).toBe(true);
    expect(result.current.walletSyncError).toBe(null);
  });
});
