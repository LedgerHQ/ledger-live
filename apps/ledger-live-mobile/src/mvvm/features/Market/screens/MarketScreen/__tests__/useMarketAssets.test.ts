import { act, renderHook, waitFor } from "@tests/test-renderer";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { Order, type MarketListRequestResult } from "@ledgerhq/live-common/market/utils/types";
import { createMarketCurrencyData } from "../../../__tests__/helpers";
import { useMarketAssets } from "../useMarketAssets";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketDataProvider");
const mockedUseMarketData = jest.mocked(useMarketData);

const bitcoin = createMarketCurrencyData({ id: "bitcoin", name: "Bitcoin" });
const ethereum = createMarketCurrencyData({ id: "ethereum", name: "Ethereum", ticker: "eth" });
const fullMarketPage = Array.from({ length: 20 }, (_, index) =>
  createMarketCurrencyData({ id: `asset-${index}`, name: `Asset ${index}` }),
);
const fullMarketPageWithDuplicate = [
  ...Array.from({ length: 19 }, (_, index) =>
    createMarketCurrencyData({ id: `asset-${index}`, name: `Asset ${index}` }),
  ),
  createMarketCurrencyData({ id: "asset-0", name: "Asset 0 duplicate" }),
];
const teslaStock = createMarketCurrencyData({
  id: "tesla-xstock",
  name: "Tesla xStock",
  ticker: "tslax",
  ledgerIds: ["ethereum/erc20/tesla_xstock_0x8ad3c73f833d3f9a523ab01476625f269aeb7cf0"],
  marketcapRank: 528,
  price: 411.28,
});
function mockMarketData(overrides: Partial<MarketListRequestResult> = {}) {
  mockedUseMarketData.mockReturnValue({
    data: [bitcoin, ethereum],
    isLoading: false,
    isPending: false,
    isFetching: false,
    isError: false,
    cachedMetadataMap: new Map(),
    ...overrides,
  });
}

describe("useMarketAssets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMarketData();
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
    mockMarketData({ data: fullMarketPage, isFetching: true });
    const { result } = renderHook(() => useMarketAssets());

    // The first page is fetching, but it is not a "next page" load yet.
    expect(result.current.isFetchingNextPage).toBe(false);

    act(() => result.current.onEndReached());
    expect(mockedUseMarketData).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    expect(result.current.isFetchingNextPage).toBe(true);

    act(() => result.current.onEndReached());
    expect(mockedUseMarketData).not.toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
  });

  it("requests the next page on end reached", () => {
    mockMarketData({ data: fullMarketPage });
    const { result } = renderHook(() => useMarketAssets());
    act(() => result.current.onEndReached());
    expect(mockedUseMarketData).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  it("does not request the next page when the current page is incomplete", () => {
    const { result } = renderHook(() => useMarketAssets());

    act(() => result.current.onEndReached());

    expect(mockedUseMarketData).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
  });

  it("uses the fetched item count to decide whether the next page can load", () => {
    mockMarketData({ data: fullMarketPageWithDuplicate });
    const { result } = renderHook(() => useMarketAssets());

    expect(result.current.assets).toHaveLength(19);

    act(() => result.current.onEndReached());

    expect(mockedUseMarketData).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  it("passes the trimmed search query", () => {
    renderHook(() => useMarketAssets({ search: " b " }));

    expect(mockedUseMarketData).toHaveBeenLastCalledWith(expect.objectContaining({ search: "b" }));
  });

  it("resets the page when the search query changes", async () => {
    mockMarketData({ data: fullMarketPage });
    let search = "";
    const { result, rerender } = renderHook(() => useMarketAssets({ search }));

    act(() => result.current.onEndReached());
    expect(mockedUseMarketData).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));

    search = "eth";
    rerender(undefined);

    await waitFor(() => {
      expect(mockedUseMarketData).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, search: "eth" }),
      );
    });
    expect(mockedUseMarketData).not.toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, search: "eth" }),
    );
  });

  it("maps sorting and timeframe to the market request params", () => {
    renderHook(() => useMarketAssets({ sorting: "gainers", timeframe: "7D" }));

    expect(mockedUseMarketData).toHaveBeenLastCalledWith(
      expect.objectContaining({ order: Order.topGainers, range: "7d" }),
    );
  });

  it("maps volume sorting to the total-volume order", () => {
    renderHook(() => useMarketAssets({ sorting: "volume" }));

    expect(mockedUseMarketData).toHaveBeenLastCalledWith(
      expect.objectContaining({ order: Order.VolumeDesc }),
    );
  });

  it("maps the six-month timeframe to the market request params", () => {
    renderHook(() => useMarketAssets({ timeframe: "6M" }));

    expect(mockedUseMarketData).toHaveBeenLastCalledWith(expect.objectContaining({ range: "6m" }));
  });

  it("requests favorite assets with the starred ids sorted", () => {
    const { result } = renderHook(() =>
      useMarketAssets({ category: "starred", starredMarketCoins: ["ethereum", "bitcoin"] }),
    );

    expect(mockedUseMarketData).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, starred: ["bitcoin", "ethereum"] }),
    );
    expect(result.current.emptyState).toBeUndefined();
  });

  it("shows the favorites empty state without fetching the full asset list", () => {
    const { result } = renderHook(() =>
      useMarketAssets({ category: "starred", starredMarketCoins: [] }),
    );

    expect(mockedUseMarketData).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 0, starred: [] }),
    );
    expect(result.current.assets).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.emptyState).toBe("favorites");

    act(() => result.current.onEndReached());

    expect(mockedUseMarketData).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 0, starred: [] }),
    );
  });

  it("searches all market assets while search is active", () => {
    const { result } = renderHook(() =>
      useMarketAssets({ search: " eth ", category: "starred", starredMarketCoins: [] }),
    );

    expect(mockedUseMarketData).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, search: "eth", starred: undefined }),
    );
    expect(result.current.emptyState).toBeUndefined();
  });

  it("drops the stock category param while search is active", () => {
    renderHook(() => useMarketAssets({ search: " aapl ", category: "stocks" }));

    expect(mockedUseMarketData).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, search: "aapl", categories: undefined }),
    );
  });

  it("requests stocks from the dedicated CVS category", () => {
    mockMarketData({ data: [teslaStock] });
    const { result } = renderHook(() => useMarketAssets({ category: "stocks" }));

    expect(mockedUseMarketData).toHaveBeenLastCalledWith(
      expect.objectContaining({ categories: "tokenized-stock", page: 1 }),
    );
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
});
