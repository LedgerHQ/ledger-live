import { renderHook } from "tests/testSetup";
import { useBalanceViewModel } from "../useBalanceViewModel";
import * as usePortfolioBalanceSyncModule from "LLD/hooks/usePortfolioBalanceSync";
import { Portfolio } from "@ledgerhq/types-live";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { INITIAL_STATE } from "~/renderer/reducers/settings";

jest.mock("LLD/hooks/usePortfolioBalanceSync");

const mockUsePortfolioBalanceSync = jest.mocked(
  usePortfolioBalanceSyncModule.usePortfolioBalanceSync,
);

const mockCounterValue = {
  type: "FiatCurrency" as const,
  ticker: "USD",
  name: "US Dollar",
  units: [{ name: "US Dollar", code: "$", magnitude: 2, showAllDigits: true, prefixCode: true }],
};

const mockPortfolio: Portfolio = {
  balanceHistory: [{ date: new Date(), value: 1500 }],
  balanceAvailable: true,
  availableAccounts: [],
  unavailableCurrencies: [],
  accounts: [],
  range: "day",
  histories: [],
  countervalueReceiveSum: 0,
  countervalueSendSum: 0,
  countervalueChange: { percentage: 5.5, value: 100 },
};

const wallet40WithBalanceRefreshRework = {
  ...INITIAL_STATE.overriddenFeatureFlags,
  lwdWallet40: {
    enabled: true,
    params: { balanceRefreshRework: true },
  },
};

const defaultBalanceSyncReturn = {
  portfolio: mockPortfolio,
  counterValue: mockCounterValue,
  balanceAvailable: true,
  isColdStart: false,
  isInitialLoading: false,
  isBalanceLoading: false,
  isManualRefreshLoading: false,
  stableSyncPending: false,
  hasCvOrBridgeError: false,
  hasWalletSyncError: false,
  triggerRefresh: jest.fn(),
};

const initialState = {
  settings: {
    ...INITIAL_STATE,
    counterValue: "USD",
    counterValueCurrency: mockCounterValue,
    selectedTimeRange: "week" as const,
    overriddenFeatureFlags: wallet40WithBalanceRefreshRework,
  },
};

describe("useBalanceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioBalanceSync.mockReturnValue(defaultBalanceSyncReturn);
  });

  it("returns balance data and flags when balance is available", () => {
    const { result } = renderHook(() => useBalanceViewModel(), { initialState });

    expect(result.current.balance).toBe(1500);
    expect(result.current.balanceAvailable).toBe(true);
    expect(result.current.formatter).toBeDefined();
    expect(result.current.formatter(result.current.balance).integerPart).toContain("15");
    expect(result.current.valueChange).toEqual(mockPortfolio.countervalueChange);
    expect(result.current.isColdStart).toBe(false);
    expect(result.current.shouldDisplayBalanceRefreshRework).toBe(true);
    expect(result.current.hasAccount).toBeDefined();
    expect(result.current.hasOnboardedDevice).toBeDefined();
  });

  it("returns balance 0 when balance history is empty", () => {
    mockUsePortfolioBalanceSync.mockReturnValue({
      ...defaultBalanceSyncReturn,
      portfolio: { ...mockPortfolio, balanceHistory: [] },
    });

    const { result } = renderHook(() => useBalanceViewModel(), { initialState });

    expect(result.current.balance).toBe(0);
    expect(result.current.formatter(result.current.balance).integerPart).toContain("0");
  });

  it("uses day range by default (legacyRange false)", () => {
    renderHook(() => useBalanceViewModel(), { initialState });

    expect(mockUsePortfolioBalanceSync).toHaveBeenCalledWith({ legacyRange: false });
  });

  it("uses selected time range when legacyRange is true", () => {
    renderHook(() => useBalanceViewModel({ legacyRange: true }), {
      initialState: {
        settings: { ...initialState.settings, selectedTimeRange: "month" as const },
      },
    });

    expect(mockUsePortfolioBalanceSync).toHaveBeenCalledWith({ legacyRange: true });
  });

  it("returns isLoading true when isBalanceLoading is true", () => {
    mockUsePortfolioBalanceSync.mockReturnValue({
      ...defaultBalanceSyncReturn,
      isBalanceLoading: true,
    });

    const { result } = renderHook(() => useBalanceViewModel(), { initialState });

    expect(result.current.isLoading).toBe(true);
  });

  it("returns isLoading true on cold start when portfolio balance is not yet available", () => {
    mockUsePortfolioBalanceSync.mockReturnValue({
      ...defaultBalanceSyncReturn,
      isColdStart: true,
      isBalanceLoading: true,
      balanceAvailable: false,
    });

    const { result } = renderHook(() => useBalanceViewModel(), {
      initialState: { ...initialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isColdStart).toBe(true);
  });

  it("freezes balance during loading and unfreezes when loading completes", () => {
    mockUsePortfolioBalanceSync.mockReturnValue({
      ...defaultBalanceSyncReturn,
      isBalanceLoading: false,
      portfolio: { ...mockPortfolio, balanceHistory: [{ date: new Date(), value: 1500 }] },
    });

    const { result, rerender } = renderHook(() => useBalanceViewModel(), { initialState });

    expect(result.current.balance).toBe(1500);

    mockUsePortfolioBalanceSync.mockReturnValue({
      ...defaultBalanceSyncReturn,
      isBalanceLoading: true,
      portfolio: { ...mockPortfolio, balanceHistory: [{ date: new Date(), value: 2000 }] },
    });
    rerender();

    expect(result.current.balance).toBe(1500);

    mockUsePortfolioBalanceSync.mockReturnValue({
      ...defaultBalanceSyncReturn,
      isBalanceLoading: false,
      portfolio: { ...mockPortfolio, balanceHistory: [{ date: new Date(), value: 2000 }] },
    });
    rerender();

    expect(result.current.balance).toBe(2000);
  });

  it("returns shouldDisplayBalanceRefreshRework false when lwdWallet40 has balanceRefreshRework false", () => {
    const { result } = renderHook(() => useBalanceViewModel(), {
      initialState: {
        settings: {
          ...initialState.settings,
          overriddenFeatureFlags: {
            ...wallet40WithBalanceRefreshRework,
            lwdWallet40: { enabled: true, params: { balanceRefreshRework: false } },
          },
        },
      },
    });

    expect(result.current.shouldDisplayBalanceRefreshRework).toBe(false);
  });
});
