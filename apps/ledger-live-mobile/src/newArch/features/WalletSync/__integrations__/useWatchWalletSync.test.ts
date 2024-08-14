import { renderHook } from "@tests/test-renderer";
import { mockedSdk, simpleTrustChain } from "./shared";
import { useWatchWalletSync } from "../hooks/useWatchWalletSync";
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
  }),
}));

describe("useWatchWalletSync", () => {
  it("should not run ledger sync watch loop when ff is disabled", async () => {
    const { result, store } = renderHook(() => useWatchWalletSync(), {});

    expect(store.getState().settings.overriddenFeatureFlags.llmWalletSync).not.toBeDefined();
    expect(result.current.visualPending).toBe(false);
    expect(result.current.walletSyncError).toBe(null);
    expect(result.current.onUserRefresh).toBeInstanceOf(Function);
    expect(result.current.onUserRefresh).not.toThrow();
  });

  // TODO: FIXME - This test is skipped because it's looping infinitely
  it.skip("should run ledger sync watch loop when ff is enabled", async () => {
    const { result, store } = renderHook(() => useWatchWalletSync(), {
      overrideInitialState: INITIAL_STATE,
    });

    console.log("store", store?.getState()?.settings.overriddenFeatureFlags.llmWalletSync?.enabled);

    expect(store?.getState()?.settings.overriddenFeatureFlags.llmWalletSync?.enabled).toBe(true);
    expect(result.current.visualPending).toBe(true);
    expect(result.current.walletSyncError).toBe(null);
  });
});
