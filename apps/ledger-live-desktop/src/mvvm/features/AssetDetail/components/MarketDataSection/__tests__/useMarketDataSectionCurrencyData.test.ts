import { renderHook } from "tests/testSetup";
import { createMockMarketCurrencyData } from "@ledgerhq/live-common/market/utils/fixtures";
import { useGetCurrencyDataQuery } from "@ledgerhq/live-common/market/state-manager/api";
import { useMarketDataSectionCurrencyData } from "../hooks/useMarketDataSectionCurrencyData";

jest.mock("@ledgerhq/live-common/market/state-manager/api", () => ({
  ...jest.requireActual("@ledgerhq/live-common/market/state-manager/api"),
  useGetCurrencyDataQuery: jest.fn(),
}));

const mockUseGetCurrencyDataQuery = jest.mocked(useGetCurrencyDataQuery);

type QueryResult = ReturnType<typeof useGetCurrencyDataQuery>;

function queryReturn(value: Partial<QueryResult>): QueryResult {
  return value as QueryResult;
}

const hookOptions = () => ({
  minimal: false as const,
  initialState: { settings: { counterValue: "USD" } },
});

describe("useMarketDataSectionCurrencyData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGetCurrencyDataQuery.mockReturnValue(
      queryReturn({
        data: createMockMarketCurrencyData(),
        isLoading: false,
        isFetching: false,
      }),
    );
  });

  it("requests currency data with the provided query id", () => {
    renderHook(() => useMarketDataSectionCurrencyData("ethereum/erc20/usd__coin"), hookOptions());

    expect(mockUseGetCurrencyDataQuery).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ethereum/erc20/usd__coin", counterCurrency: "usd" }),
      expect.objectContaining({ skip: false }),
    );
  });

  it("skips the query when no currency id is provided", () => {
    renderHook(() => useMarketDataSectionCurrencyData(undefined), hookOptions());

    expect(mockUseGetCurrencyDataQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    );
  });

  it("shows a skeleton while the query is pending and an id is set", () => {
    mockUseGetCurrencyDataQuery.mockReturnValue(
      queryReturn({ data: undefined, isLoading: true, isFetching: false }),
    );

    const { result } = renderHook(() => useMarketDataSectionCurrencyData("bitcoin"), hookOptions());

    expect(result.current.showSkeleton).toBe(true);
  });

  it("hides the skeleton once data resolves", () => {
    mockUseGetCurrencyDataQuery.mockReturnValue(
      queryReturn({
        data: createMockMarketCurrencyData(),
        isLoading: false,
        isFetching: false,
      }),
    );

    const { result } = renderHook(() => useMarketDataSectionCurrencyData("bitcoin"), hookOptions());

    expect(result.current.showSkeleton).toBe(false);
  });
});
