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
      environment: "STAGING",
      PROD: state.trustchain.PROD,
      STAGING: {
        trustchain: simpleTrustChain,
        memberCredentials: {
          pubkey: "currentInstance",
          privatekey: "privatekey",
        },
      },
    },
    settings: {
      ...state.settings,
      readOnlyModeEnabled: false,
    },
    wallet: {
      ...state.wallet,
      walletSync: {
        walletSyncState: { data: null, version: 0, environment: "STAGING" },
        isHydrated: true,
      },
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

  it("should not run ledger sync watch loop before wallet hydration", async () => {
    const { result } = renderHook(() => useWatchWalletSync(), {
      overrideInitialState: state => {
        const base = INITIAL_STATE(state);
        return {
          ...base,
          wallet: {
            ...base.wallet,
            walletSync: {
              ...base.wallet.walletSync,
              isHydrated: false,
            },
          },
        };
      },
    });

    expect(result.current.visualPending).toBe(false);
    expect(result.current.walletSyncError).toBe(null);
  });

  it("should not run ledger sync watch loop with a cursor from another environment", async () => {
    const { result } = renderHook(() => useWatchWalletSync(), {
      overrideInitialState: state => {
        const base = INITIAL_STATE(state);
        return {
          ...base,
          wallet: {
            ...base.wallet,
            walletSync: {
              ...base.wallet.walletSync,
              walletSyncState: {
                data: null,
                version: 0,
                environment: "PROD",
              },
            },
          },
        };
      },
    });

    expect(result.current.visualPending).toBe(false);
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
