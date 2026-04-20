import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { usePortfolioBalanceSectionViewModel } from "../usePortfolioBalanceSectionViewModel";
import * as usePortfolioBalanceModule from "LLM/hooks/usePortfolioBalance";
import type { SyncPhase } from "@ledgerhq/live-common/bridge/react/index";

jest.mock("LLM/hooks/usePortfolioBalance");
jest.mock("../usePersistedPortfolioBalance", () => ({
  usePersistedPortfolioBalance: (b: number) => b,
}));

const mockUsePortfolioBalance = jest.mocked(usePortfolioBalanceModule.usePortfolioBalance);

const defaultPortfolio = {
  balanceHistory: [{ date: new Date(), value: 1000 }],
  countervalueChange: { percentage: 0, value: 0 },
  balanceAvailable: true,
  availableAccounts: [],
  unavailableCurrencies: [],
  accounts: [],
  range: "day" as const,
  histories: [],
  countervalueReceiveSum: 0,
  countervalueSendSum: 0,
};

function makeReturn(
  overrides: Partial<{
    balanceAvailable: boolean;
    syncPhase: SyncPhase;
    portfolio: typeof defaultPortfolio;
    isCvPending: boolean;
  }> = {},
) {
  return {
    portfolio: defaultPortfolio,
    balanceAvailable: true,
    syncPhase: "synced" as SyncPhase,
    isBalanceLoading: false,
    isColdStart: false,
    isManualRefreshLoading: false,
    isCvPending: false,
    allAccounts: [],
    accountsWithError: [],
    accountsImpactedByError: [],
    errorCurrencyIds: [],
    listOfErrorAccountNames: "",
    areAllAccountsUpToDate: true,
    hasAccounts: true,
    handleSync: jest.fn(),
    isBridgeSyncPending: false,
    triggerRefresh: jest.fn(),
    ...overrides,
  };
}

const defaultProps = { showAssets: true, isReadOnlyMode: false };

const withFreezeFlag = {
  overrideInitialState: withFlagOverrides({
    lwmWallet40: { enabled: true, params: { balanceRefreshRework: true } },
  }),
};

describe("usePortfolioBalanceSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioBalance.mockReturnValue(makeReturn());
  });

  describe("state", () => {
    it("returns noSigner when readOnly, regardless of showAssets", () => {
      const { result } = renderHook(() =>
        usePortfolioBalanceSectionViewModel({ showAssets: false, isReadOnlyMode: true }),
      );
      expect(result.current.state).toBe("noSigner");
    });

    it("returns noAccounts when showAssets is false", () => {
      const { result } = renderHook(() =>
        usePortfolioBalanceSectionViewModel({ showAssets: false, isReadOnlyMode: false }),
      );
      expect(result.current.state).toBe("noAccounts");
    });
  });

  describe("isLoading", () => {
    it("is true while syncPhase is syncing, false otherwise", () => {
      const { result, rerender } = renderHook(() =>
        usePortfolioBalanceSectionViewModel(defaultProps),
      );
      expect(result.current.isLoading).toBe(false);

      mockUsePortfolioBalance.mockReturnValue(makeReturn({ syncPhase: "syncing" }));
      rerender({});
      expect(result.current.isLoading).toBe(true);

      mockUsePortfolioBalance.mockReturnValue(makeReturn({ syncPhase: "failed" }));
      rerender({});
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("balance freeze", () => {
    it("freezes while CVS is pending (iCvPending=true) and releases once CVS settles", () => {
      mockUsePortfolioBalance.mockReturnValue(
        makeReturn({
          portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 1500 }] },
        }),
      );

      const { result, rerender } = renderHook(
        () => usePortfolioBalanceSectionViewModel(defaultProps),
        withFreezeFlag,
      );
      expect(result.current.balance).toBe(1500);

      // Sync starts with CVS pending — balance must be frozen
      mockUsePortfolioBalance.mockReturnValue(
        makeReturn({
          syncPhase: "syncing",
          isCvPending: true,
          portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 2000 }] },
        }),
      );
      rerender({});
      expect(result.current.balance).toBe(1500);
    });

    it("scopes isLoading to isCvPending when flag is enabled", () => {
      // With feature flag on: isLoading = iCvPending (not full syncPhase)
      mockUsePortfolioBalance.mockReturnValue(
        makeReturn({ syncPhase: "syncing", isCvPending: true }),
      );
      const { result, rerender } = renderHook(
        () => usePortfolioBalanceSectionViewModel(defaultProps),
        withFreezeFlag,
      );
      expect(result.current.isLoading).toBe(true);

      // CVS settles — shimmer turns off even though bridge sync continues
      mockUsePortfolioBalance.mockReturnValue(
        makeReturn({ syncPhase: "syncing", isCvPending: false }),
      );
      rerender({});
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("isBalanceAvailable", () => {
    it("stays false until syncPhase settles when there is no cached balance", () => {
      const emptyPortfolio = {
        ...defaultPortfolio,
        balanceHistory: [{ date: new Date(), value: 0 }],
      };

      mockUsePortfolioBalance.mockReturnValue(
        makeReturn({ balanceAvailable: false, syncPhase: "syncing", portfolio: emptyPortfolio }),
      );

      const { result, rerender } = renderHook(() =>
        usePortfolioBalanceSectionViewModel(defaultProps),
      );
      expect(result.current.isBalanceAvailable).toBe(false);

      mockUsePortfolioBalance.mockReturnValue(
        makeReturn({ balanceAvailable: true, syncPhase: "syncing", portfolio: emptyPortfolio }),
      );
      rerender({});
      expect(result.current.isBalanceAvailable).toBe(false);

      mockUsePortfolioBalance.mockReturnValue(
        makeReturn({ balanceAvailable: true, syncPhase: "synced", portfolio: emptyPortfolio }),
      );
      rerender({});
      expect(result.current.isBalanceAvailable).toBe(true);
    });

    it("is true immediately at cold start when a cached balance exists", () => {
      mockUsePortfolioBalance.mockReturnValue(
        makeReturn({ balanceAvailable: false, syncPhase: "syncing" }),
      );

      const { result } = renderHook(() => usePortfolioBalanceSectionViewModel(defaultProps));

      // effectiveLatestBalance = 1000 (from defaultPortfolio via pass-through mock),
      // so effectiveRawBalanceAvailable = true and balanceAvailable starts as true.
      expect(result.current.isBalanceAvailable).toBe(true);
    });
  });
});
