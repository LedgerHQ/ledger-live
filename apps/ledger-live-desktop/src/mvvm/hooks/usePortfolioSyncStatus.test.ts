import { renderHook } from "tests/testSetup";
import { usePortfolioSyncStatus } from "./usePortfolioSyncStatus";
import * as portfolioModule from "@ledgerhq/live-countervalues-react/portfolio";
import { Portfolio } from "@ledgerhq/types-live";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";

jest.mock("@ledgerhq/live-countervalues-react/portfolio", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react/portfolio"),
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
  balanceHistory: [{ date: new Date(), value: 100000 }],
  balanceAvailable: true,
  availableAccounts: [],
  unavailableCurrencies: [],
  accounts: [],
  range: "day",
  histories: [],
  countervalueReceiveSum: 0,
  countervalueSendSum: 0,
  countervalueChange: { percentage: 5.42, value: 5000 },
};

const defaultInitialState = {
  settings: {
    counterValue: "USD",
    counterValueCurrency: mockCounterValue,
    selectedTimeRange: "week" as const,
  },
  accounts: [],
};

describe("usePortfolioSyncStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolioThrottled.mockReturnValue(mockPortfolio);
  });

  it("returns portfolio, counterValue and isColdStart from usePortfolioThrottled and selectors", () => {
    const { result } = renderHook(() => usePortfolioSyncStatus(), {
      initialState: defaultInitialState,
    });

    expect(result.current.portfolio).toEqual(mockPortfolio);
    expect(result.current.counterValue).toMatchObject({
      type: "FiatCurrency",
      ticker: "USD",
      name: "US Dollar",
      units: [{ code: "$", magnitude: 2 }],
    });
    expect(result.current.isColdStart).toBe(false);
  });

  it("returns isColdStart true when hasAccounts and balance not yet available", () => {
    mockUsePortfolioThrottled.mockReturnValue({ ...mockPortfolio, balanceAvailable: false });

    const { result } = renderHook(() => usePortfolioSyncStatus(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isColdStart).toBe(true);
  });

  it("returns isColdStart false when no accounts", () => {
    mockUsePortfolioThrottled.mockReturnValue({ ...mockPortfolio, balanceAvailable: false });

    const { result } = renderHook(() => usePortfolioSyncStatus(), {
      initialState: defaultInitialState,
    });

    expect(result.current.isColdStart).toBe(false);
  });

  it("returns isColdStart false when balance is available even with accounts", () => {
    const { result } = renderHook(() => usePortfolioSyncStatus(), {
      initialState: { ...defaultInitialState, accounts: [BTC_ACCOUNT] },
    });

    expect(result.current.isColdStart).toBe(false);
  });

  it("uses day range (DEFAULT_PORTFOLIO_RANGE) when legacyRange is false", () => {
    renderHook(() => usePortfolioSyncStatus(), { initialState: defaultInitialState });

    expect(portfolioModule.usePortfolioThrottled).toHaveBeenCalledWith(
      expect.objectContaining({ range: "day" }),
    );
  });

  it("uses selectedTimeRange when legacyRange is true", () => {
    renderHook(() => usePortfolioSyncStatus({ legacyRange: true }), {
      initialState: {
        ...defaultInitialState,
        settings: { ...defaultInitialState.settings, selectedTimeRange: "month" as const },
      },
    });

    expect(portfolioModule.usePortfolioThrottled).toHaveBeenCalledWith(
      expect.objectContaining({ range: "month" }),
    );
  });
});
