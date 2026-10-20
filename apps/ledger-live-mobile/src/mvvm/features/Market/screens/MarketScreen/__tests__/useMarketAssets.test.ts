import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useSupportedCounterCurrencies } from "@ledgerhq/live-common/cg-client/hooks/useCoingeckoDataProvider";
import { useUsdToFiatRate } from "@features/platform-market-countervalues";
import {
  Order,
  type MarketListRequestParams,
  type MarketListRequestResult,
} from "@ledgerhq/live-common/market/utils/types";
import { createMockMarketListResult } from "@ledgerhq/live-common/market/utils/fixtures";
import type { State } from "~/reducers/types";
import { createMarketCurrencyData } from "../../../__tests__/helpers";
import { useMarketAssets } from "../useMarketAssets";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketDataProvider");
jest.mock("@ledgerhq/live-common/cg-client/hooks/useCoingeckoDataProvider");
jest.mock("@features/platform-market-countervalues", () => ({
  ...jest.requireActual("@features/platform-market-countervalues"),
  useUsdToFiatRate: jest.fn(),
}));
const mockedUseMarketData = jest.mocked(useMarketData);
const mockedUseSupportedCounterCurrencies = jest.mocked(useSupportedCounterCurrencies);
const mockedUseUsdToFiatRate = jest.mocked(useUsdToFiatRate);
const mockFetchNextPage = jest.fn();

const bitcoin = createMarketCurrencyData({ id: "bitcoin", name: "Bitcoin" });
const ethereum = createMarketCurrencyData({ id: "ethereum", name: "Ethereum", ticker: "eth" });
const fullMarketPage = Array.from({ length: 20 }, (_, index) =>
  createMarketCurrencyData({ id: `asset-${index}`, name: `Asset ${index}` }),
);
const teslaStock = createMarketCurrencyData({
  id: "tesla-xstock",
  name: "Tesla xStock",
  ticker: "tslax",
  ledgerIds: ["ethereum/erc20/tesla_xstock_0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0"],
  marketcapRank: 528,
  price: 411.28,
});
function mockMarketData(overrides: Partial<MarketListRequestResult> = {}) {
  mockedUseMarketData.mockReturnValue(
    createMockMarketListResult({
      data: [bitcoin, ethereum],
      fetchNextPage: mockFetchNextPage,
      ...overrides,
    }),
  );
}

function mockSupportedCounterCurrencies(supportedCounterCurrencies?: string[]) {
  mockedUseSupportedCounterCurrencies.mockReturnValue({
    data: supportedCounterCurrencies,
  } as unknown as ReturnType<typeof useSupportedCounterCurrencies>);
}

function mockUsdToFiatRate(rate: ReturnType<typeof useUsdToFiatRate>) {
  mockedUseUsdToFiatRate.mockReturnValue(rate);
}

const DEFAULT_REFRESH_RATE = 3 * 60_000;

function expectMarketDataLastCalledWith(
  params: Partial<MarketListRequestParams>,
  options: { enabled?: boolean; refreshRate?: number } = {},
) {
  expect(mockedUseMarketData).toHaveBeenLastCalledWith(expect.objectContaining(params), {
    enabled: true,
    refreshRate: DEFAULT_REFRESH_RATE,
    ...options,
  });
}

// Force the locale so the expected formatted price is deterministic.
const withCounterValue = (ticker: string) => ({
  overrideInitialState: (state: State) => ({
    ...state,
    settings: { ...state.settings, counterValue: ticker, language: "en" },
  }),
});

describe("useMarketAssets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMarketData();
    // Defaults: supported list not yet loaded + a no-op rate, i.e. no USD fallback.
    mockSupportedCounterCurrencies(undefined);
    mockUsdToFiatRate({ status: "ready", rate: 1 });
  });

  it("maps market data into display rows", () => {
    const { result } = renderHook(() => useMarketAssets());
    expect(result.current.assets).toHaveLength(2);
    expect(result.current.assets[0]).toMatchObject({ id: "bitcoin", name: "Bitcoin" });
  });

  it("deduplicates rows that share the same id across pages", () => {
    mockMarketData({ data: [bitcoin, bitcoin, ethereum] });
    const { result } = renderHook(() => useMarketAssets());
    expect(result.current.assets).toHaveLength(2);
  });

  it("reports the initial loading state only while there is nothing to show", () => {
    mockMarketData({ data: [], isPending: true });
    const { result } = renderHook(() => useMarketAssets());
    expect(result.current.loading).toBe(true);
  });

  it("does not request another page while the next page is fetching", () => {
    mockMarketData({ data: fullMarketPage, hasNextPage: true, isFetchingNextPage: true });
    const { result } = renderHook(() => useMarketAssets());

    expect(result.current.isFetchingNextPage).toBe(true);

    act(() => result.current.onEndReached());
    expect(mockFetchNextPage).not.toHaveBeenCalled();
  });

  it("does not flag a first-page refetch as a next page load", () => {
    mockMarketData({ data: fullMarketPage, hasNextPage: true, isFetching: true });
    const { result } = renderHook(() => useMarketAssets());

    expect(result.current.isFetchingNextPage).toBe(false);
  });

  it("forwards a reset of the loaded pages", () => {
    const resetToFirstPage = jest.fn();
    mockMarketData({ resetToFirstPage });

    const { result } = renderHook(() => useMarketAssets());
    act(() => result.current.resetToFirstPage());

    expect(resetToFirstPage).toHaveBeenCalledTimes(1);
  });

  it("requests the next page on end reached", () => {
    mockMarketData({ data: fullMarketPage, hasNextPage: true });
    const { result } = renderHook(() => useMarketAssets());
    act(() => result.current.onEndReached());
    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("does not request the next page when there is none", () => {
    const { result } = renderHook(() => useMarketAssets());

    act(() => result.current.onEndReached());

    expect(mockFetchNextPage).not.toHaveBeenCalled();
  });

  it("refreshes the list on the mobile market interval", () => {
    renderHook(() => useMarketAssets(), {
      overrideInitialState: withFlagOverrides({
        llmRefreshMarketData: { enabled: true, params: { refreshTime: 1 } },
      }),
    });

    expectMarketDataLastCalledWith({}, { refreshRate: 60_000 });
  });

  it("passes the trimmed search query", () => {
    renderHook(() => useMarketAssets({ search: " b " }));

    expectMarketDataLastCalledWith({ search: "b" });
  });

  it("maps sorting and timeframe to the market request params", () => {
    renderHook(() => useMarketAssets({ sorting: "gainers", timeframe: "7D" }));

    expectMarketDataLastCalledWith({ order: Order.topGainers, range: "7d" });
  });

  it("maps volume sorting to the total-volume order", () => {
    renderHook(() => useMarketAssets({ sorting: "volume" }));

    expectMarketDataLastCalledWith({ order: Order.VolumeDesc });
  });

  it("maps the six-month timeframe to the market request params", () => {
    renderHook(() => useMarketAssets({ timeframe: "6M" }));

    expectMarketDataLastCalledWith({ range: "6m" });
  });

  it("requests favorite assets with the starred ids", () => {
    const { result } = renderHook(() =>
      useMarketAssets({ category: "starred", starredMarketCoins: ["ethereum", "bitcoin"] }),
    );

    expectMarketDataLastCalledWith({ starred: ["ethereum", "bitcoin"] });
    expect(result.current.emptyState).toBeUndefined();
  });

  it("shows the favorites empty state without fetching the full asset list", () => {
    const { result } = renderHook(() =>
      useMarketAssets({ category: "starred", starredMarketCoins: [] }),
    );

    expectMarketDataLastCalledWith({ starred: [] }, { enabled: false });
    expect(result.current.assets).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.emptyState).toBe("favorites");

    act(() => result.current.onEndReached());

    expect(mockFetchNextPage).not.toHaveBeenCalled();
  });

  it("searches all market assets while search is active", () => {
    const { result } = renderHook(() =>
      useMarketAssets({ search: " eth ", category: "starred", starredMarketCoins: [] }),
    );

    expectMarketDataLastCalledWith({ search: "eth", starred: undefined });
    expect(result.current.emptyState).toBeUndefined();
  });

  it("drops the stock category param while search is active", () => {
    renderHook(() => useMarketAssets({ search: " aapl ", category: "stocks" }));

    expectMarketDataLastCalledWith({ search: "aapl", categories: undefined });
  });

  it("requests stocks from the dedicated CVS category", () => {
    mockMarketData({ data: [teslaStock] });
    const { result } = renderHook(() => useMarketAssets({ category: "stocks" }));

    expectMarketDataLastCalledWith({ categories: "tokenized-stock" });
    expect(result.current.assets).toHaveLength(1);
    expect(result.current.assets[0]).toMatchObject({
      id: "tesla-xstock",
      name: "Tesla xStock",
      ledgerIds: teslaStock.ledgerIds,
    });
  });

  it("shows the stocks empty state when CVS returns no stock rows", () => {
    mockMarketData({ data: [] });

    const { result } = renderHook(() => useMarketAssets({ category: "stocks" }));

    expect(result.current.assets).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.emptyState).toBe("stocks");
  });

  it("keeps CVS stock rows without ledger ids but does not make them resolvable", () => {
    mockMarketData({ data: [{ ...teslaStock, ledgerIds: [] }] });

    const { result } = renderHook(() => useMarketAssets({ category: "stocks" }));

    expect(result.current.assets).toHaveLength(1);
    expect(result.current.assets[0]).toMatchObject({
      id: "tesla-xstock",
      name: "Tesla xStock",
      ticker: "tslax",
      ledgerIds: [],
    });
  });

  describe("unsupported fiat countervalue (COP)", () => {
    const SUPPORTED_WITHOUT_COP = ["usd", "eur", "vnd"];

    it("disables the market request while countervalue support is unresolved", () => {
      mockSupportedCounterCurrencies(undefined);

      const { result } = renderHook(() => useMarketAssets(), withCounterValue("COP"));

      expectMarketDataLastCalledWith({ counterCurrency: "cop" }, { enabled: false });
      expect(mockedUseUsdToFiatRate).toHaveBeenCalledWith("usd", { skip: true });
      expect(result.current.assets).toEqual([]);
      expect(result.current.loading).toBe(true);
    });

    it("requests in USD and rescales each row by the USD->COP rate", () => {
      mockSupportedCounterCurrencies(["usd", "cop"]);
      mockUsdToFiatRate({ status: "ready", rate: 1 });
      mockMarketData({ data: [createMarketCurrencyData({ id: "bitcoin", price: 400_000 })] });
      const control = renderHook(() => useMarketAssets(), withCounterValue("COP"));
      expectMarketDataLastCalledWith({ counterCurrency: "cop" });
      const expectedCopPrice = control.result.current.assets[0].formattedPrice;

      mockSupportedCounterCurrencies(SUPPORTED_WITHOUT_COP);
      mockUsdToFiatRate({ status: "ready", rate: 4000 });
      mockMarketData({ data: [createMarketCurrencyData({ id: "bitcoin", price: 100 })] });
      const { result } = renderHook(() => useMarketAssets(), withCounterValue("COP"));

      expectMarketDataLastCalledWith({ counterCurrency: "usd" });
      expect(mockedUseUsdToFiatRate).toHaveBeenCalledWith("cop", { skip: false });
      expect(result.current.assets[0].formattedPrice).toBe(expectedCopPrice);
    });

    it("withholds rows and stays loading until the rate resolves", () => {
      mockSupportedCounterCurrencies(SUPPORTED_WITHOUT_COP);
      mockUsdToFiatRate({ status: "loading", rate: null });

      const { result } = renderHook(() => useMarketAssets(), withCounterValue("COP"));

      expect(result.current.assets).toEqual([]);
      expect(result.current.loading).toBe(true);
    });

    it("surfaces an error when the rate request fails", () => {
      mockSupportedCounterCurrencies(SUPPORTED_WITHOUT_COP);
      mockUsdToFiatRate({ status: "error", rate: null });

      const { result } = renderHook(() => useMarketAssets(), withCounterValue("COP"));

      expect(result.current.assets).toEqual([]);
      expect(result.current.isError).toBe(true);
    });

    it("does not request the next page when the rate request fails", () => {
      mockSupportedCounterCurrencies(SUPPORTED_WITHOUT_COP);
      mockUsdToFiatRate({ status: "error", rate: null });
      mockMarketData({ data: fullMarketPage, hasNextPage: true });

      const { result } = renderHook(() => useMarketAssets(), withCounterValue("COP"));

      act(() => result.current.onEndReached());

      expect(mockFetchNextPage).not.toHaveBeenCalled();
    });

    it("requests the countervalue natively once it is known to be supported", () => {
      mockSupportedCounterCurrencies(["usd", "eur", "cop"]);
      mockMarketData({ data: [createMarketCurrencyData({ id: "bitcoin", price: 100 })] });

      renderHook(() => useMarketAssets(), withCounterValue("COP"));

      expectMarketDataLastCalledWith({ counterCurrency: "cop" });
      expect(mockedUseUsdToFiatRate).toHaveBeenCalledWith("usd", { skip: false });
    });
  });

  describe("crypto countervalue (BTC)", () => {
    it("waits for the supported counter-value list like any fiat currency", () => {
      mockSupportedCounterCurrencies(undefined);

      const { result } = renderHook(() => useMarketAssets(), withCounterValue("BTC"));

      expectMarketDataLastCalledWith({ counterCurrency: "btc" }, { enabled: false });
      expect(result.current.loading).toBe(true);
    });

    it("requests in BTC directly once the supported list confirms it is native", () => {
      mockSupportedCounterCurrencies(["usd", "eur", "btc"]);
      mockMarketData({
        data: [createMarketCurrencyData({ id: "bitcoin", price: 100, marketcap: 200 })],
      });

      const { result } = renderHook(() => useMarketAssets(), withCounterValue("BTC"));

      expectMarketDataLastCalledWith({ counterCurrency: "btc" });
      expect(mockedUseUsdToFiatRate).toHaveBeenCalledWith("usd", { skip: false });
      expect(result.current.loading).toBe(false);
      expect(result.current.assets[0].formattedPrice).toContain("₿");
      expect(result.current.assets[0].formattedMarketCap).toContain("₿");
    });
  });
});
