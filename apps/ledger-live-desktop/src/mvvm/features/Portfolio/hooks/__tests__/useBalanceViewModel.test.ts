import { renderHook } from "tests/testSetup";
import { useBalanceViewModel } from "../useBalanceViewModel";
import * as portfolioModule from "@ledgerhq/live-countervalues-react/portfolio";
import { Portfolio } from "@ledgerhq/types-live";

jest.mock("@ledgerhq/live-countervalues-react/portfolio");

const mockUsePortfolio = jest.mocked(portfolioModule.usePortfolio);

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

const initialState = {
  settings: {
    counterValue: "USD",
    counterValueCurrency: mockCounterValue,
    selectedTimeRange: "week" as const,
  },
};

describe("useBalanceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolio.mockReturnValue(mockPortfolio);
  });

  it("should return portfolio data correctly", () => {
    const { result } = renderHook(() => useBalanceViewModel(), { initialState });

    expect(result.current.formatter).toBeDefined();
    expect(result.current.balance).toBe(1500);
    const formatted = result.current.formatter(result.current.balance);
    expect(formatted.integerPart).toContain("15");
    expect(result.current.valueChange).toEqual(mockPortfolio.countervalueChange);
  });

  it("should return 0 when balance history is empty", () => {
    mockUsePortfolio.mockReturnValue({
      ...mockPortfolio,
      balanceHistory: [],
    });

    const { result } = renderHook(() => useBalanceViewModel(), { initialState });

    expect(result.current.balance).toBe(0);
    const formatted = result.current.formatter(result.current.balance);
    expect(formatted.integerPart).toContain("0");
  });

  it("should use 'day' range by default", () => {
    renderHook(() => useBalanceViewModel(), { initialState });

    expect(portfolioModule.usePortfolio).toHaveBeenCalledWith(
      expect.objectContaining({ range: "day" }),
    );
  });

  it("should use selected time range when useLegacyRange is true", () => {
    renderHook(() => useBalanceViewModel({ useLegacyRange: true }), {
      initialState: {
        settings: { ...initialState.settings, selectedTimeRange: "month" as const },
      },
    });

    expect(portfolioModule.usePortfolio).toHaveBeenCalledWith(
      expect.objectContaining({ range: "month" }),
    );
  });
});
