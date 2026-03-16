import { renderHook } from "@tests/test-renderer";
import { usePortfolioBalanceSectionViewModel } from "../usePortfolioBalanceSectionViewModel";
import * as usePortfolioBalanceModule from "LLM/hooks/usePortfolioBalance";
import type { SyncPhase } from "@ledgerhq/live-common/bridge/react/index";
import type { State } from "~/reducers/types";

jest.mock("LLM/hooks/usePortfolioBalance");

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

function makePortfolioBalanceReturn(
  overrides: Partial<{
    portfolio: typeof defaultPortfolio;
    balanceAvailable: boolean;
    syncPhase: SyncPhase;
    isBalanceLoading: boolean;
  }> = {},
) {
  return {
    portfolio: defaultPortfolio,
    balanceAvailable: true,
    syncPhase: "synced" as SyncPhase,
    isBalanceLoading: false,
    isColdStart: false,
    allAccounts: [],
    accountsWithError: [],
    listOfErrorAccountNames: "",
    areAllAccountsUpToDate: true,
    hasAccounts: true,
    handleSync: jest.fn(),
    ...overrides,
  };
}

const defaultProps = { showAssets: true, isReadOnlyMode: false };

describe("usePortfolioBalanceSectionViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioBalance.mockReturnValue(makePortfolioBalanceReturn());
  });

  describe("state determination", () => {
    it("should return 'noSigner' state when isReadOnlyMode is true", () => {
      const { result } = renderHook(() =>
        usePortfolioBalanceSectionViewModel({
          showAssets: false,
          isReadOnlyMode: true,
        }),
      );

      expect(result.current.state).toBe("noSigner");
    });

    it("should return 'noAccounts' state when isReadOnlyMode is false and showAssets is false", () => {
      const { result } = renderHook(() =>
        usePortfolioBalanceSectionViewModel({
          showAssets: false,
          isReadOnlyMode: false,
        }),
      );

      expect(result.current.state).toBe("noAccounts");
    });

    it("should return 'normal' state when isReadOnlyMode is false and showAssets is true", () => {
      const { result } = renderHook(() =>
        usePortfolioBalanceSectionViewModel({
          showAssets: true,
          isReadOnlyMode: false,
        }),
      );

      expect(result.current.state).toBe("normal");
    });

    it("should prioritize noSigner over noAccounts when both conditions are met", () => {
      const { result } = renderHook(() =>
        usePortfolioBalanceSectionViewModel({
          showAssets: false,
          isReadOnlyMode: true,
        }),
      );

      expect(result.current.state).toBe("noSigner");
    });
  });

  describe("isLoading", () => {
    it("should be false when syncPhase is synced", () => {
      const { result } = renderHook(() => usePortfolioBalanceSectionViewModel(defaultProps));

      expect(result.current.isLoading).toBe(false);
    });

    it("should be true when syncPhase is syncing", () => {
      mockUsePortfolioBalance.mockReturnValue(
        makePortfolioBalanceReturn({ syncPhase: "syncing", isBalanceLoading: true }),
      );

      const { result } = renderHook(() => usePortfolioBalanceSectionViewModel(defaultProps));

      expect(result.current.isLoading).toBe(true);
    });

    it("should be false when syncPhase is failed", () => {
      mockUsePortfolioBalance.mockReturnValue(makePortfolioBalanceReturn({ syncPhase: "failed" }));

      const { result } = renderHook(() => usePortfolioBalanceSectionViewModel(defaultProps));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("balance freeze during sync", () => {
    // Balance freeze requires shouldDisplayBalanceRefreshRework to be enabled.
    const withFreezeFlag = {
      overrideInitialState: (state: State): State => ({
        ...state,
        settings: {
          ...state.settings,
          overriddenFeatureFlags: {
            lwmWallet40: { enabled: true, params: { balanceRefreshRework: true } },
          },
        },
      }),
    };

    it("should freeze balance during syncing and release when synced", () => {
      mockUsePortfolioBalance.mockReturnValue(
        makePortfolioBalanceReturn({
          syncPhase: "synced",
          portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 1500 }] },
        }),
      );

      const { result, rerender } = renderHook(
        () => usePortfolioBalanceSectionViewModel(defaultProps),
        withFreezeFlag,
      );
      expect(result.current.balance).toBe(1500);

      mockUsePortfolioBalance.mockReturnValue(
        makePortfolioBalanceReturn({
          syncPhase: "syncing",
          isBalanceLoading: true,
          portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 2000 }] },
        }),
      );
      rerender({});
      expect(result.current.balance).toBe(1500);

      mockUsePortfolioBalance.mockReturnValue(
        makePortfolioBalanceReturn({
          syncPhase: "synced",
          portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 2000 }] },
        }),
      );
      rerender({});
      expect(result.current.balance).toBe(2000);
    });
  });

  describe("balanceAvailable stickiness", () => {
    it("should keep balanceAvailable false until sync settles (no shimmer gap after skeleton)", () => {
      mockUsePortfolioBalance.mockReturnValue(
        makePortfolioBalanceReturn({
          balanceAvailable: false,
          syncPhase: "syncing",
          isBalanceLoading: true,
        }),
      );

      const { result, rerender } = renderHook(() =>
        usePortfolioBalanceSectionViewModel(defaultProps),
      );
      expect(result.current.isBalanceAvailable).toBe(false);

      mockUsePortfolioBalance.mockReturnValue(
        makePortfolioBalanceReturn({
          balanceAvailable: true,
          syncPhase: "syncing",
          isBalanceLoading: false,
          portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 1200 }] },
        }),
      );
      rerender({});
      expect(result.current.isBalanceAvailable).toBe(false);

      mockUsePortfolioBalance.mockReturnValue(
        makePortfolioBalanceReturn({
          balanceAvailable: true,
          syncPhase: "synced",
          portfolio: { ...defaultPortfolio, balanceHistory: [{ date: new Date(), value: 1200 }] },
        }),
      );
      rerender({});
      expect(result.current.isBalanceAvailable).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
