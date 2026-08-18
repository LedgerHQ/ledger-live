import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { bindCtx } from "@ledgerhq/live-wallet/accounts";
import { mockedSdk, simpleTrustChain } from "./shared";
import { useWatchWalletSync } from "../hooks/useWatchWalletSync";

const INITIAL_STATE = withFlagOverrides(
  {
    llmWalletSync: {
      enabled: true,
      params: {
        environment: "STAGING",
        watchConfig: {},
      },
    },
  },
  state => ({
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
    },
  }),
);

jest.mock("@ledgerhq/live-wallet/accounts", () => {
  const actual = jest.requireActual("@ledgerhq/live-wallet/accounts");
  return { ...actual, bindCtx: jest.fn(actual.bindCtx) };
});

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

    expect(store.getState().featureFlags.overrides.llmWalletSync).not.toBeDefined();
    expect(result.current.visualPending).toBe(false);
    expect(result.current.walletSyncError).toBe(null);
    expect(result.current.onUserRefresh).toBeInstanceOf(Function);
    expect(result.current.onUserRefresh).not.toThrow();
  });

  it("should run ledger sync watch loop when ff is enabled", async () => {
    const { result, store } = renderHook(() => useWatchWalletSync(), {
      overrideInitialState: INITIAL_STATE,
    });

    expect(store?.getState()?.featureFlags.overrides.llmWalletSync?.enabled).toBe(true);
    expect(result.current.visualPending).toBe(true);
    expect(result.current.walletSyncError).toBe(null);
  });

  it("should bind the accounts sync module with the user's blacklisted token ids", async () => {
    const blacklistedTokenIds = ["ethereum/erc20/usd_tether__erc20_"];
    jest.mocked(bindCtx).mockClear();
    renderHook(() => useWatchWalletSync(), {
      overrideInitialState: state => {
        const base = INITIAL_STATE(state);
        return { ...base, settings: { ...base.settings, blacklistedTokenIds } };
      },
    });

    expect(bindCtx).toHaveBeenCalledWith(expect.objectContaining({ blacklistedTokenIds }));
  });
});
