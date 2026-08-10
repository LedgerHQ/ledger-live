import { renderHook } from "@tests/test-renderer";
import {
  useStocksData,
  selectTopStocks,
  type StockSuggestion,
} from "@features/platform-aggregated-assets";
import { useDefaultStocksAssets } from "../useDefaultStocksAssets";

jest.mock("@features/platform-aggregated-assets", () => ({
  ...jest.requireActual("@features/platform-aggregated-assets"),
  useStocksData: jest.fn(),
  selectTopStocks: jest.fn(),
}));

const mockedStocks = jest.mocked(useStocksData);
const mockedSelectTopStocks = jest.mocked(selectTopStocks);

const stock = (ticker: string): StockSuggestion => ({
  id: ticker,
  name: ticker,
  ticker,
  navigationId: ticker,
  ledgerId: ticker,
});

describe("useDefaultStocksAssets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStocks.mockReturnValue({
      data: { stocks: true },
      isLoading: false,
      isError: false,
    } as never);
    mockedSelectTopStocks.mockReturnValue([stock("AAPL"), stock("TSLA")]);
  });

  it("returns the top stocks (capped at maxStocks) from the DADA stocks data", () => {
    const { result } = renderHook(() => useDefaultStocksAssets(true, 20));

    expect(result.current.stocks.map(s => s.ticker)).toEqual(["AAPL", "TSLA"]);
    expect(mockedSelectTopStocks).toHaveBeenCalledWith(expect.anything(), 20);
  });

  it("reports loading while the query is in flight", () => {
    mockedStocks.mockReturnValue({ data: undefined, isLoading: true, isError: false } as never);

    const { result } = renderHook(() => useDefaultStocksAssets(true, 20));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.stocks).toEqual([]);
  });

  it("flags isError on failure", () => {
    mockedStocks.mockReturnValue({ data: undefined, isLoading: false, isError: true } as never);

    const { result } = renderHook(() => useDefaultStocksAssets(true, 20));

    expect(result.current.isError).toBe(true);
  });

  it("is a no-op when disabled (skips the query, empty result)", () => {
    const { result } = renderHook(() => useDefaultStocksAssets(false, 20));

    expect(result.current.stocks).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockedStocks).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });
});
