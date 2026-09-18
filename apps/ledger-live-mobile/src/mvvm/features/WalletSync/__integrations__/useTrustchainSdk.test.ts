import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import { importWalletSyncState } from "@domain/entity-wallet-sync";
import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useTrustchainSdk } from "../hooks/useTrustchainSdk";

jest.mock("@ledgerhq/ledger-key-ring-protocol/index", () => ({
  ...jest.requireActual("@ledgerhq/ledger-key-ring-protocol/index"),
  getSdk: jest.fn(),
}));

jest.mock("../hooks/useInstanceName", () => ({
  useInstanceName: () => "Mobile instance",
}));

describe("useTrustchainSdk", () => {
  const withStagingFeature = withFlagOverrides({
    llmWalletSync: {
      enabled: true,
      params: {
        environment: "STAGING",
        watchConfig: {},
        learnMoreLink: "",
      },
    },
  });

  it("publishes the environment captured by the Trustchain SDK", () => {
    const sdk = {} as ReturnType<typeof getSdk>;
    jest.mocked(getSdk).mockReturnValue(sdk);

    const { result, store } = renderHook(() => useTrustchainSdk(), {
      overrideInitialState: withFlagOverrides(
        {
          llmWalletSync: {
            enabled: true,
            params: {
              environment: "STAGING",
              watchConfig: {},
              learnMoreLink: "",
            },
          },
        },
        state => ({
          ...state,
          wallet: {
            ...state.wallet,
            walletSync: {
              walletSyncState: { data: null, version: 0 },
              isHydrated: true,
            },
          },
        }),
      ),
    });

    expect(result.current).toBe(sdk);
    expect(jest.mocked(getSdk)).toHaveBeenCalledWith(
      expect.any(Boolean),
      expect.not.objectContaining({ environment: expect.anything() }),
      expect.any(Function),
    );
    expect(store.getState().trustchain.environment).toBe("STAGING");
    expect(store.getState().wallet.walletSync).toEqual({
      walletSyncState: { data: null, version: 0, environment: "STAGING" },
      isHydrated: true,
    });
    expect(getSdk).toHaveBeenCalledTimes(1);
  });

  it("reconciles a hydrated cursor when the LKRP environment is already published", () => {
    const { store } = renderHook(() => useTrustchainSdk(), {
      overrideInitialState: state => {
        const base = withStagingFeature(state);
        return {
          ...base,
          trustchain: { ...base.trustchain, environment: "STAGING" },
          wallet: {
            ...base.wallet,
            walletSync: {
              walletSyncState: {
                data: { accounts: ["prod"] },
                version: 3,
                environment: "PROD",
              },
              isHydrated: true,
            },
          },
        };
      },
    });

    expect(store.getState().wallet.walletSync).toEqual({
      walletSyncState: { data: null, version: 0, environment: "STAGING" },
      isHydrated: true,
    });
  });

  it("reconciles when cursor hydration finishes after environment publication", () => {
    const { store } = renderHook(() => useTrustchainSdk(), {
      overrideInitialState: state => {
        const base = withStagingFeature(state);
        return {
          ...base,
          wallet: {
            ...base.wallet,
            walletSync: {
              walletSyncState: { data: null, version: 0 },
              isHydrated: false,
            },
          },
        };
      },
    });

    expect(store.getState().trustchain.environment).toBe("STAGING");
    expect(store.getState().wallet.walletSync.walletSyncState).toEqual({
      data: null,
      version: 0,
    });

    act(() => {
      store.dispatch(
        importWalletSyncState({
          data: { accounts: ["prod"] },
          version: 3,
          environment: "PROD",
        }),
      );
    });

    expect(store.getState().wallet.walletSync).toEqual({
      walletSyncState: { data: null, version: 0, environment: "STAGING" },
      isHydrated: true,
    });
  });
});
