import { renderHook } from "tests/testSetup";
import { useBalanceViewModel } from "../useBalanceViewModel";
import * as usePortfolioBalanceSyncModule from "LLD/hooks/usePortfolioBalanceSync";
import { Portfolio } from "@ledgerhq/types-live";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { INITIAL_STATE } from "~/renderer/reducers/settings";

jest.mock("@ledgerhq/live-countervalues-react/portfolio", () => ({
  usePortfolioThrottled: jest.fn(),
}));

const mockUsePortfolioThrottled = jest.mocked(portfolioModule.usePortfolioThrottled);

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
  isBalanceLoading: false,
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

const bitcoinCurrency = getCryptoCurrencyById("bitcoin");
const minimalAccount = genAccount("mock-account-1", { currency: bitcoinCurrency });

describe("useBalanceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioThrottled.mockReturnValue(mockPortfolio);
  });

  it("returns balance data and flags when balance is available", () => {
    const { result } = renderHook(() => useBalanceViewModel(), { initialState });

    expect(result.current.balance).toBe(1500);
    expect(result.current.formatter).toBeDefined();
    expect(result.current.formatter(result.current.balance).integerPart).toContain("15");
    expect(result.current.valueChange).toEqual(mockPortfolio.countervalueChange);
    expect(result.current.isColdStart).toBe(false);
    expect(result.current.shouldDisplayBalanceRefreshRework).toBe(true);
    expect(result.current.hasAccount).toBeDefined();
    expect(result.current.hasOnboardedDevice).toBeDefined();
  });

  it("returns balance 0 when balance history is empty", () => {
    mockUsePortfolioThrottled.mockReturnValue({ ...mockPortfolio, balanceHistory: [] });

    const { result } = renderHook(() => useBalanceViewModel(), { initialState });

    expect(result.current.balance).toBe(0);
    expect(result.current.formatter(result.current.balance).integerPart).toContain("0");
  });

  it("uses day range by default (legacyRange false)", () => {
    renderHook(() => useBalanceViewModel(), { initialState });

    expect(portfolioModule.usePortfolioThrottled).toHaveBeenCalledWith(
      expect.objectContaining({ range: "day" }),
    );
  });

  it("uses selected time range when legacyRange is true", () => {
    renderHook(() => useBalanceViewModel({ legacyRange: true }), {
      initialState: {
        settings: { ...initialState.settings, selectedTimeRange: "month" as const },
      },
    });

    expect(portfolioModule.usePortfolioThrottled).toHaveBeenCalledWith(
      expect.objectContaining({ range: "month" }),
    );
  });

  it("returns isLoading true when isBalanceLoading is true (e.g. countervalues polling)", () => {
    mockUsePortfolioBalanceSync.mockReturnValue({
      ...defaultBalanceSyncReturn,
      isBalanceLoading: true,
    });

    const { result } = renderHook(() => useBalanceViewModel(), { initialState });

    expect(result.current.isLoading).toBe(true);
  });

  it("returns isLoading true on cold start when portfolio balance is not yet available", () => {
    mockUsePortfolioThrottled.mockReturnValue({ ...mockPortfolio, balanceAvailable: false });

    const { result } = renderHook(() => useBalanceViewModel(), {
      initialState: { ...initialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isColdStart).toBe(true);
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
