import { renderHook } from "tests/testSetup";
import { MOCK_MARKET_CURRENCY_DATA } from "@ledgerhq/live-common/market/utils/fixtures";
import { Order } from "@ledgerhq/live-common/market/utils/types";
import { track } from "~/renderer/analytics/segment";
import { MarketTableData, useMarketTableViewModel } from "../useMarketTableViewModel";
import { mockT } from "../../__tests__/shared";

const mockedTrack = jest.mocked(track);

const mockParentRef = { current: null };
const mockRowVirtualizer = { getVirtualItems: () => [], getTotalSize: () => 0 };

jest.mock("../../../hooks/useMarketListVirtualization", () => ({
  useMarketListVirtualization: () => ({
    parentRef: mockParentRef,
    rowVirtualizer: mockRowVirtualizer,
  }),
}));

function createData(overrides: Partial<MarketTableData> = {}): MarketTableData {
  return {
    marketData: MOCK_MARKET_CURRENCY_DATA,
    marketParams: { order: Order.MarketCapDesc, counterCurrency: "usd", range: "24h" },
    locale: "en",
    freshLoading: false,
    isError: false,
    loading: false,
    currenciesLength: MOCK_MARKET_CURRENCY_DATA.length,
    itemCount: MOCK_MARKET_CURRENCY_DATA.length,
    listKey: "all",
    starredMarketCoins: ["bitcoin"],
    resetSearch: jest.fn(),
    refresh: jest.fn(),
    toggleStar: jest.fn(),
    onLoadNextPage: jest.fn(),
    checkIfDataIsStaleAndRefetch: jest.fn(),
    t: mockT,
    ...overrides,
  };
}

describe("useMarketTableViewModel", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should report a currency as starred when present in starredMarketCoins", () => {
    const { result } = renderHook(() => useMarketTableViewModel(createData()));

    expect(result.current.isStarred("bitcoin")).toBe(true);
    expect(result.current.isStarred("ethereum")).toBe(false);
  });

  it("should derive marketCapSort from the current order", () => {
    const { result: desc } = renderHook(() =>
      useMarketTableViewModel(createData({ marketParams: { order: Order.MarketCapDesc } })),
    );
    expect(desc.current.marketCapSort).toBe("desc");
    expect(desc.current.changeSort).toBeUndefined();

    const { result: asc } = renderHook(() =>
      useMarketTableViewModel(createData({ marketParams: { order: Order.MarketCapAsc } })),
    );
    expect(asc.current.marketCapSort).toBe("asc");
  });

  it("should derive changeSort from gainers/losers order", () => {
    const { result: gainers } = renderHook(() =>
      useMarketTableViewModel(createData({ marketParams: { order: Order.topGainers } })),
    );
    expect(gainers.current.changeSort).toBe("desc");
    expect(gainers.current.marketCapSort).toBeUndefined();

    const { result: losers } = renderHook(() =>
      useMarketTableViewModel(createData({ marketParams: { order: Order.topLosers } })),
    );
    expect(losers.current.changeSort).toBe("asc");
  });

  it("should derive volumeSort from the volume order", () => {
    const { result: desc } = renderHook(() =>
      useMarketTableViewModel(createData({ marketParams: { order: Order.VolumeDesc } })),
    );
    expect(desc.current.volumeSort).toBe("desc");
    expect(desc.current.marketCapSort).toBeUndefined();

    const { result: asc } = renderHook(() =>
      useMarketTableViewModel(createData({ marketParams: { order: Order.VolumeAsc } })),
    );
    expect(asc.current.volumeSort).toBe("asc");
  });

  it("should toggle the market cap order between desc and asc", () => {
    const refresh = jest.fn();

    const { result: fromDesc } = renderHook(() =>
      useMarketTableViewModel(
        createData({ refresh, marketParams: { order: Order.MarketCapDesc } }),
      ),
    );
    fromDesc.current.onToggleMarketCap();
    expect(refresh).toHaveBeenCalledWith({ order: Order.MarketCapAsc });

    refresh.mockClear();
    const { result: fromAsc } = renderHook(() =>
      useMarketTableViewModel(createData({ refresh, marketParams: { order: Order.MarketCapAsc } })),
    );
    fromAsc.current.onToggleMarketCap();
    expect(refresh).toHaveBeenCalledWith({ order: Order.MarketCapDesc });
  });

  it("should toggle the change order between top gainers and top losers", () => {
    const refresh = jest.fn();

    const { result: fromGainers } = renderHook(() =>
      useMarketTableViewModel(createData({ refresh, marketParams: { order: Order.topGainers } })),
    );
    fromGainers.current.onToggleChange();
    expect(refresh).toHaveBeenCalledWith({ order: Order.topLosers });

    refresh.mockClear();
    const { result: fromOther } = renderHook(() =>
      useMarketTableViewModel(
        createData({ refresh, marketParams: { order: Order.MarketCapDesc } }),
      ),
    );
    fromOther.current.onToggleChange();
    expect(refresh).toHaveBeenCalledWith({ order: Order.topGainers });
  });

  it("should toggle the volume order between desc and asc", () => {
    const refresh = jest.fn();

    const { result: fromDesc } = renderHook(() =>
      useMarketTableViewModel(createData({ refresh, marketParams: { order: Order.VolumeDesc } })),
    );
    fromDesc.current.onToggleVolume();
    expect(refresh).toHaveBeenCalledWith({ order: Order.VolumeAsc });

    refresh.mockClear();
    const { result: fromOther } = renderHook(() =>
      useMarketTableViewModel(
        createData({ refresh, marketParams: { order: Order.MarketCapDesc } }),
      ),
    );
    fromOther.current.onToggleVolume();
    expect(refresh).toHaveBeenCalledWith({ order: Order.VolumeDesc });
  });

  it("should track sort_market_list with the resulting sort state and timeframe on toggle", () => {
    const { result } = renderHook(() =>
      useMarketTableViewModel(
        createData({
          marketParams: { order: Order.MarketCapDesc, range: "7d" },
        }),
      ),
    );

    result.current.onToggleVolume();

    expect(mockedTrack).toHaveBeenCalledWith("sort_market_list", {
      sortVolume: "true_desc",
      sortMarketCap: "false",
      sortChange: "false",
      timeframe: "7D",
    });
  });

  it("should show the skeleton while fresh loading or on error", () => {
    const { result: loadingResult } = renderHook(() =>
      useMarketTableViewModel(createData({ freshLoading: true })),
    );
    expect(loadingResult.current.showSkeleton).toBe(true);

    const { result: errorResult } = renderHook(() =>
      useMarketTableViewModel(createData({ isError: true })),
    );
    expect(errorResult.current.showSkeleton).toBe(true);

    const { result: idleResult } = renderHook(() => useMarketTableViewModel(createData()));
    expect(idleResult.current.showSkeleton).toBe(false);
  });

  it("should pass through params, locale and emptyState", () => {
    const { result } = renderHook(() =>
      useMarketTableViewModel(createData({ emptyState: "favorites" })),
    );

    expect(result.current.counterCurrency).toBe("usd");
    expect(result.current.range).toBe("24h");
    expect(result.current.locale).toBe("en");
    expect(result.current.emptyState).toBe("favorites");
  });
});
