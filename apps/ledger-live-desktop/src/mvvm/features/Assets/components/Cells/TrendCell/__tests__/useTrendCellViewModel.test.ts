import { renderHook } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { useTrendCellViewModel } from "../useTrendCellViewModel";
import { useCurrencyPortfolio } from "~/renderer/actions/portfolio";

jest.mock("~/renderer/actions/portfolio", () => ({
  useCurrencyPortfolio: jest.fn(),
}));

const mockedUseCurrencyPortfolio = jest.mocked(useCurrencyPortfolio);
const mockCurrency = getCryptoCurrencyById("bitcoin");

const mockCurrencyPortfolioReturn = (percentage: number | null | undefined) => ({
  history: [],
  countervalueAvailable: true,
  histories: [],
  accounts: [],
  range: "day" as const,
  cryptoChange: { value: 0, percentage: null },
  countervalueChange: { value: 0, percentage },
});

describe("useTrendCellViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCurrencyPortfolio.mockReturnValue(mockCurrencyPortfolioReturn(0.023));
  });

  it("should call useCurrencyPortfolio with range 'day'", () => {
    renderHook(() => useTrendCellViewModel(mockCurrency));

    expect(mockedUseCurrencyPortfolio).toHaveBeenCalledWith({
      currency: mockCurrency,
      range: "day",
    });
  });

  it("should return formatted positive percentage with + prefix and success color", () => {
    mockedUseCurrencyPortfolio.mockReturnValue(mockCurrencyPortfolioReturn(0.023));

    const { result } = renderHook(() => useTrendCellViewModel(mockCurrency));

    expect(result.current.formattedTrend).toBe("+2.30%");
    expect(result.current.colorClass).toBe("text-success");
  });

  it("should return formatted negative percentage with error color", () => {
    mockedUseCurrencyPortfolio.mockReturnValue(mockCurrencyPortfolioReturn(-0.015));

    const { result } = renderHook(() => useTrendCellViewModel(mockCurrency));

    expect(result.current.formattedTrend).toBe("-1.50%");
    expect(result.current.colorClass).toBe("text-error");
  });

  it("should return '-' with muted color when percentage is null", () => {
    mockedUseCurrencyPortfolio.mockReturnValue(mockCurrencyPortfolioReturn(null));

    const { result } = renderHook(() => useTrendCellViewModel(mockCurrency));

    expect(result.current.formattedTrend).toBe("-");
    expect(result.current.colorClass).toBe("text-muted");
  });

  it("should return '-' with muted color when percentage is undefined", () => {
    mockedUseCurrencyPortfolio.mockReturnValue(mockCurrencyPortfolioReturn(undefined));

    const { result } = renderHook(() => useTrendCellViewModel(mockCurrency));

    expect(result.current.formattedTrend).toBe("-");
    expect(result.current.colorClass).toBe("text-muted");
  });

  it("should return 0.00% with success color for zero percentage", () => {
    mockedUseCurrencyPortfolio.mockReturnValue(mockCurrencyPortfolioReturn(0));

    const { result } = renderHook(() => useTrendCellViewModel(mockCurrency));

    expect(result.current.formattedTrend).toBe("0.00%");
    expect(result.current.colorClass).toBe("text-success");
  });
});
