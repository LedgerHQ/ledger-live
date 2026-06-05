import { act, renderHook, waitFor } from "@tests/test-renderer";
import { useMarketData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { MarketListRequestResult } from "@ledgerhq/live-common/market/utils/types";
import { createMarketCurrencyData } from "../../../__tests__/helpers";
import { useMarketAssets } from "../useMarketAssets";

jest.mock("@ledgerhq/live-common/market/hooks/useMarketDataProvider");
const mockedUseMarketData = jest.mocked(useMarketData);

const bitcoin = createMarketCurrencyData({ id: "bitcoin", name: "Bitcoin" });
const ethereum = createMarketCurrencyData({ id: "ethereum", name: "Ethereum", ticker: "eth" });

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
    expect(result.current.loadingMore).toBe(false);
  });

  it("reports loading-more when a new page is fetched over existing rows", () => {
    mockMarketData({ isFetching: true });
    const { result } = renderHook(() => useMarketAssets());
    expect(result.current.loading).toBe(false);
    expect(result.current.loadingMore).toBe(true);
  });

  it("requests the next page on end reached", () => {
    const { result } = renderHook(() => useMarketAssets());
    act(() => result.current.onEndReached());
    expect(mockedUseMarketData).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });

  it("passes the trimmed search query", () => {
    renderHook(() => useMarketAssets({ search: " b " }));

    expect(mockedUseMarketData).toHaveBeenLastCalledWith(expect.objectContaining({ search: "b" }));
  });

  it("resets the page when the search query changes", async () => {
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
});
