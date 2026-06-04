import { act, renderHook } from "@tests/test-renderer";
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
});
