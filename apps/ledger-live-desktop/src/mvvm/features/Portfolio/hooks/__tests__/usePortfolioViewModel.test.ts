import { renderHook, withFlagOverrides } from "tests/testSetup";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { usePortfolioViewModel } from "../usePortfolioViewModel";

// usePortfolioViewModel consumes useResumeAddAccountAfterOnboarding, which pulls in the Add Account
// flow (useOpenAssetFlow). Mock it so this suite stays focused on the portfolio view-model.
// The resume behaviour itself is covered by useResumeAddAccountAfterOnboarding.test.ts.
jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: () => ({
    openAssetFlow: jest.fn(),
    openAddAccountFlow: jest.fn(),
  }),
}));

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const ethereumCurrency = getCryptoCurrencyById("ethereum");
const wallet40AndExchangeFeatureFlags = withFlagOverrides({
  portfolioExchangeBanner: { enabled: true },
  lwdWallet40: {
    enabled: true,
  },
});
const wallet40AndExchangeSettings = {
  ...INITIAL_STATE,
};

describe("usePortfolioViewModel", () => {
  it("should compute account and portfolio totals when accounts are provided", () => {
    const accounts = [
      genAccount("btc-account", {
        currency: bitcoinCurrency,
        operationsSize: 1,
      }),
      genAccount("eth-account-1", {
        currency: ethereumCurrency,
        operationsSize: 2,
      }),
      genAccount("eth-account-2", {
        currency: ethereumCurrency,
        operationsSize: 0,
      }),
    ];

    const { result } = renderHook(() => usePortfolioViewModel(), {
      initialState: {
        accounts,
        settings: {
          ...wallet40AndExchangeSettings,
          filterTokenOperationsZeroAmount: true,
          showClearCacheBanner: true,
        },
        ...wallet40AndExchangeFeatureFlags,
      },
    });

    expect(result.current.totalAccounts).toBe(3);
    expect(result.current.totalCurrencies).toBe(2);
    expect(result.current.totalOperations).toBe(3);
  });

  it("should expose wallet40 and exchange banner flags when enabled in settings", () => {
    const { result } = renderHook(() => usePortfolioViewModel(), {
      initialState: {
        settings: wallet40AndExchangeSettings,
        ...wallet40AndExchangeFeatureFlags,
      },
    });

    expect(result.current.hasExchangeBannerCTA).toBe(true);
  });

  it("should replace the perps and borrow entry points when services entry points are enabled", () => {
    const { result } = renderHook(usePortfolioViewModel, {
      initialState: {
        settings: INITIAL_STATE,
        ...withFlagOverrides({
          entryPointsServices: { enabled: true },
          ptxBorrowLiveApp: { enabled: true },
        }),
      },
    });

    expect(result.current.shouldDisplayServicesEntryPoints).toBe(true);
    expect(result.current.shouldDisplayPerpsEntryPoint).toBe(false);
    expect(result.current.shouldDisplayBorrowSection).toBe(false);
  });

  it("should keep the perps and borrow entry points when services entry points are disabled", () => {
    const { result } = renderHook(usePortfolioViewModel, {
      initialState: {
        settings: INITIAL_STATE,
        ...withFlagOverrides({
          entryPointsServices: { enabled: false },
          ptxBorrowLiveApp: { enabled: true },
        }),
      },
    });

    expect(result.current.shouldDisplayServicesEntryPoints).toBe(false);
    expect(result.current.shouldDisplayPerpsEntryPoint).toBe(true);
    expect(result.current.shouldDisplayBorrowSection).toBe(true);
  });

  it("should expose clear cache banner visibility when enabled in settings", () => {
    const { result } = renderHook(() => usePortfolioViewModel(), {
      initialState: {
        settings: {
          ...INITIAL_STATE,
          showClearCacheBanner: true,
        },
      },
    });

    expect(result.current.isClearCacheBannerVisible).toBe(true);
  });
});
