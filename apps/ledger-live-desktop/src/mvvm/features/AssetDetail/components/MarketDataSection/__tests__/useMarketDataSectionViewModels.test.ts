import { renderHook } from "tests/testSetup";
import { createMockMarketCurrencyData } from "@ledgerhq/live-common/market/utils/fixtures";
import { useGetCurrencyDataQuery } from "@ledgerhq/live-common/market/state-manager/api";
import { useMarketStatsViewModel } from "../MarketStats/hooks/useMarketStatsViewModel";
import { usePricePerformanceViewModel } from "../PricePerformance/hooks/usePricePerformanceViewModel";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useParams: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/market/state-manager/api", () => ({
  ...jest.requireActual("@ledgerhq/live-common/market/state-manager/api"),
  useGetCurrencyDataQuery: jest.fn(),
}));

jest.mock("~/renderer/hooks/useDateFormatter", () => ({
  ...(jest.requireActual("~/renderer/hooks/useDateFormatter") as Record<string, unknown>),
  useDateFormatter: jest.fn(() => () => "Nov 10, 2021"),
  fromNow: jest.fn(() => "2 years ago"),
}));

const { useParams } = jest.requireMock("react-router");

const mockUseGetCurrencyDataQuery = jest.mocked(useGetCurrencyDataQuery);

type QueryResult = ReturnType<typeof useGetCurrencyDataQuery>;

function queryReturn(value: Partial<QueryResult>): QueryResult {
  return value as QueryResult;
}

const hookOptions = () => ({
  minimal: false as const,
  initialState: { settings: { counterValue: "USD" } },
});

describe("useMarketStatsViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ "*": "bitcoin" });
    mockUseGetCurrencyDataQuery.mockReturnValue(
      queryReturn({
        data: createMockMarketCurrencyData({ marketcapRank: 1 }),
        isLoading: false,
        isFetching: false,
      }),
    );
  });

  it("requests currency data using the decoded route id when the slug is encoded", () => {
    useParams.mockReturnValue({ "*": "ethereum%2Ferc20%2Fusd__coin" });

    renderHook(() => useMarketStatsViewModel(), hookOptions());

    expect(mockUseGetCurrencyDataQuery).toHaveBeenCalledWith(
      expect.objectContaining({ id: "ethereum/erc20/usd__coin", counterCurrency: "usd" }),
      expect.objectContaining({ skip: false }),
    );
  });

  it("skips currency data until a route slug is present", () => {
    useParams.mockReturnValue({ "*": undefined });

    renderHook(() => useMarketStatsViewModel(), hookOptions());

    expect(mockUseGetCurrencyDataQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    );
  });

  it("shows a skeleton while the query is pending and slug is resolved", () => {
    mockUseGetCurrencyDataQuery.mockReturnValue(
      queryReturn({ data: undefined, isLoading: true, isFetching: false }),
    );

    const { result } = renderHook(() => useMarketStatsViewModel(), hookOptions());

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

    const { result } = renderHook(() => useMarketStatsViewModel(), hookOptions());

    expect(result.current.showSkeleton).toBe(false);
  });

  it("formats market rank with a sharp sign when CoinGecko rank is positive", () => {
    mockUseGetCurrencyDataQuery.mockReturnValue(
      queryReturn({
        data: createMockMarketCurrencyData({ marketcapRank: 3 }),
        isLoading: false,
        isFetching: false,
      }),
    );

    const { result } = renderHook(() => useMarketStatsViewModel(), hookOptions());
    const rankRow = result.current.rows.find(r => r.key === "market_rank");

    expect(rankRow?.value).toBe("#3");
  });

  it("uses an em dash for zero marketcap rank", () => {
    mockUseGetCurrencyDataQuery.mockReturnValue(
      queryReturn({
        data: createMockMarketCurrencyData({ marketcapRank: 0 }),
        isLoading: false,
        isFetching: false,
      }),
    );

    const { result } = renderHook(() => useMarketStatsViewModel(), hookOptions());

    expect(result.current.rows.find(r => r.key === "market_rank")?.value).toBe("—");
  });

  it("lists fixed stat rows in design order", () => {
    const { result } = renderHook(() => useMarketStatsViewModel(), hookOptions());

    expect(result.current.rows.map(r => r.key)).toEqual([
      "market_cap",
      "market_rank",
      "circulating_supply",
      "max_supply",
      "trading_volume_24h",
    ]);
  });

  it("exposes translated section header strings from the view model", () => {
    const { result } = renderHook(() => useMarketStatsViewModel(), hookOptions());

    expect(result.current.sectionTitle).toBeTruthy();
    expect(result.current.sectionTooltip).toBeTruthy();
  });
});

describe("usePricePerformanceViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ "*": "bitcoin" });
    mockUseGetCurrencyDataQuery.mockReturnValue(
      queryReturn({
        data: createMockMarketCurrencyData({
          price: 50_000,
          ath: 69_000,
          athDate: new Date("2021-11-10T00:00:00.000Z"),
          atl: 67.81,
          atlDate: new Date("2013-07-06T00:00:00.000Z"),
          low24h: 49_000,
          high24h: 51_000,
        }),
        isLoading: false,
        isFetching: false,
      }),
    );
  });

  it("renders ATH change vs current price as a percentage", () => {
    const { result } = renderHook(() => usePricePerformanceViewModel(), hookOptions());

    expect(result.current.athBlock.changeText).not.toBe("—");
    expect(result.current.athBlock.changeText).toMatch(/^-/);
    expect(result.current.athBlock.changeText).toMatch(/%$/);
  });

  it("uses em dash change text when ATH is zero so the ratio is undefined", () => {
    mockUseGetCurrencyDataQuery.mockReturnValue(
      queryReturn({
        data: createMockMarketCurrencyData({ price: 50_000, ath: 0 }),
        isLoading: false,
        isFetching: false,
      }),
    );

    const { result } = renderHook(() => usePricePerformanceViewModel(), hookOptions());

    expect(result.current.athBlock.changeText).toBe("—");
  });

  it("pairs 24h low and high fiat amounts when both are present", () => {
    const { result } = renderHook(() => usePricePerformanceViewModel(), hookOptions());

    expect(result.current.range24hRow.value).toMatch(/49/);
    expect(result.current.range24hRow.value).toMatch(/51/);
    expect(result.current.range24hRow.value).toContain(" / ");
    expect(result.current.range24hRow.key).toBe("range_24h");
  });

  it("uses em dash for 24h range when either bound is nullish", () => {
    mockUseGetCurrencyDataQuery.mockReturnValue(
      queryReturn({
        data: createMockMarketCurrencyData({
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- exercising nullish bounds in VM
          low24h: null as unknown as number,
          high24h: 51_000,
        }),
        isLoading: false,
        isFetching: false,
      }),
    );

    const { result } = renderHook(() => usePricePerformanceViewModel(), hookOptions());

    expect(result.current.range24hRow.value).toBe("—");
  });

  it("shows a skeleton while fetching without cached data", () => {
    mockUseGetCurrencyDataQuery.mockReturnValue(
      queryReturn({ data: undefined, isLoading: false, isFetching: true }),
    );

    const { result } = renderHook(() => usePricePerformanceViewModel(), hookOptions());

    expect(result.current.showSkeleton).toBe(true);
  });

  it("combines mocked long-date and relative parts for ATH line", () => {
    const { result } = renderHook(() => usePricePerformanceViewModel(), hookOptions());

    expect(result.current.athBlock.dateLine).toBe("Nov 10, 2021 (2 years ago)");
  });

  it("falls back title keys for ATH and ATL sections", () => {
    const { result } = renderHook(() => usePricePerformanceViewModel(), hookOptions());

    expect(result.current.athBlock.title).toBeTruthy();
    expect(result.current.atlBlock.title).toBeTruthy();
    expect(result.current.athBlock.title).not.toBe(result.current.atlBlock.title);
  });

  it("exposes translated price performance section title from the view model", () => {
    const { result } = renderHook(() => usePricePerformanceViewModel(), hookOptions());

    expect(result.current.sectionTitle).toBeTruthy();
  });
});
