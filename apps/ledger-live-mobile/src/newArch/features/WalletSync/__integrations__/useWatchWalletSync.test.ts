import { renderHook } from "@tests/test-renderer";
import { mockedSdk, simpleTrustChain } from "./shared";
import { useWalletSyncMobile } from "../hooks/useWalletSyncMobile";
import { State } from "~/reducers/types";

const INITIAL_STATE = (state: State) => ({
  ...state,
  trustchain: {
    trustchain: simpleTrustChain,
    memberCredentials: {
      pubkey: "currentInstance",
      privatekey: "privatekey",
    },
  },
  settings: {
    ...state.settings,
    readOnlyModeEnabled: false,
    overriddenFeatureFlags: {
      llmWalletSync: {
        enabled: true,
        params: {
          environment: "STAGING",
          watchConfig: {},
        },
      },
    },
  },
});

jest.mock("../hooks/useTrustchainSdk", () => ({
  useTrustchainSdk: () => ({
    getMembers: (mockedSdk.getMembers = jest.fn()),
    removeMember: (mockedSdk.removeMember = jest.fn()),
    initMemberCredentials: (mockedSdk.initMemberCredentials = jest.fn()),
  }),
}));

// Mock useWatchWalletSync to return expected structure for integration tests
jest.mock("@ledgerhq/live-wallet-sync-react", () => ({
  ...jest.requireActual("@ledgerhq/live-wallet-sync-react"),
  useWatchWalletSync: jest.fn(({ feature }) => ({
    visualPending: feature?.enabled ? true : false,
    walletSyncError: null,
    onUserRefresh: jest.fn(() => {}),
  })),
}));

describe("useWalletSyncMobile", () => {
  it("should not run ledger sync watch loop when ff is disabled", async () => {
    const { result, store } = renderHook(() => useWalletSyncMobile(), {});

    expect(store.getState().settings.overriddenFeatureFlags.llmWalletSync).not.toBeDefined();
    expect(result.current.visualPending).toBe(false);
    expect(result.current.walletSyncError).toBe(null);

    expect(typeof result.current.onUserRefresh).toBe("function");
    expect(result.current.onUserRefresh).not.toThrow();
  });

  it("should run ledger sync watch loop when ff is enabled", async () => {
    const { result, store } = renderHook(() => useWalletSyncMobile(), {
      overrideInitialState: INITIAL_STATE,
    });

    expect(store?.getState()?.settings.overriddenFeatureFlags.llmWalletSync?.enabled).toBe(true);
    expect(result.current.visualPending).toBe(true);
    expect(result.current.walletSyncError).toBe(null);
  });
});
