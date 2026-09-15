/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "tests/testSetup";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { useMarketListVirtualization } from "../useMarketListVirtualization";
import { mockDomMeasurements, setRefCurrent } from "LLD/features/__tests__/shared";
import { MOCK_MARKET_CURRENCY_DATA } from "@ledgerhq/live-common/market/utils/fixtures";

const buildData = (count: number): MarketCurrencyData[] =>
  Array.from(
    { length: count },
    (_, index) => ({ ...MOCK_MARKET_CURRENCY_DATA[0], id: `asset-${index}` }) as MarketCurrencyData,
  );

describe("useMarketListVirtualization", () => {
  const mockOnLoadNextPage = jest.fn();
  const mockCheckIfDataIsStaleAndRefetch = jest.fn();

  beforeAll(() => {
    mockDomMeasurements();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize virtualization with correct values", () => {
    const { result } = renderHook(() =>
      useMarketListVirtualization({
        itemCount: 10,
        marketData: MOCK_MARKET_CURRENCY_DATA,
        loading: false,
        currenciesLength: 2,
        listKey: "all",
        onLoadNextPage: mockOnLoadNextPage,
        checkIfDataIsStaleAndRefetch: mockCheckIfDataIsStaleAndRefetch,
      }),
    );

    expect(result.current.parentRef).toBeDefined();
    expect(result.current.parentRef.current).toBeNull();
    expect(result.current.rowVirtualizer).toBeDefined();
    expect(result.current.rowVirtualizer.getVirtualItems).toBeDefined();
  });

  it("should call onLoadNextPage when reaching the end of the list", async () => {
    const { result, rerender } = renderHook(
      ({ itemCount, marketData, loading, currenciesLength, listKey }) =>
        useMarketListVirtualization({
          itemCount,
          marketData,
          loading,
          currenciesLength,
          listKey,
          onLoadNextPage: mockOnLoadNextPage,
          checkIfDataIsStaleAndRefetch: mockCheckIfDataIsStaleAndRefetch,
        }),
      {
        initialProps: {
          itemCount: 10,
          marketData: MOCK_MARKET_CURRENCY_DATA,
          loading: false,
          currenciesLength: 2,
          listKey: "all",
        },
      },
    );

    const mockParentElement = document.createElement("div");
    Object.defineProperty(mockParentElement, "scrollTop", {
      writable: true,
      value: 0,
    });
    Object.defineProperty(mockParentElement, "scrollHeight", {
      writable: true,
      value: 1000,
    });

    setRefCurrent(result.current.parentRef, mockParentElement);

    rerender({
      itemCount: 10,
      marketData: MOCK_MARKET_CURRENCY_DATA,
      loading: false,
      currenciesLength: 2,
      listKey: "all",
    });

    await waitFor(() => {
      expect(mockOnLoadNextPage).toHaveBeenCalled();
    });
  });

  it("should call onLoadNextPage for a category list (itemCount equals currenciesLength)", async () => {
    const { result, rerender } = renderHook(() =>
      useMarketListVirtualization({
        itemCount: MOCK_MARKET_CURRENCY_DATA.length,
        marketData: MOCK_MARKET_CURRENCY_DATA,
        loading: false,
        currenciesLength: MOCK_MARKET_CURRENCY_DATA.length,
        listKey: "infrastructure",
        onLoadNextPage: mockOnLoadNextPage,
        checkIfDataIsStaleAndRefetch: mockCheckIfDataIsStaleAndRefetch,
      }),
    );

    const mockParentElement = document.createElement("div");
    Object.defineProperty(mockParentElement, "scrollTop", {
      writable: true,
      value: 0,
    });
    Object.defineProperty(mockParentElement, "scrollHeight", {
      writable: true,
      value: 1000,
    });

    setRefCurrent(result.current.parentRef, mockParentElement);
    rerender();

    await waitFor(() => {
      expect(mockOnLoadNextPage).toHaveBeenCalled();
    });
  });

  it("stops fetching once a page returns no new rows (ref guard end-detection)", async () => {
    const { result, rerender } = renderHook(
      ({ listKey }: { listKey: string }) =>
        useMarketListVirtualization({
          itemCount: MOCK_MARKET_CURRENCY_DATA.length,
          marketData: MOCK_MARKET_CURRENCY_DATA,
          loading: false,
          currenciesLength: MOCK_MARKET_CURRENCY_DATA.length,
          listKey,
          onLoadNextPage: mockOnLoadNextPage,
          checkIfDataIsStaleAndRefetch: mockCheckIfDataIsStaleAndRefetch,
        }),
      { initialProps: { listKey: "all" } },
    );

    const mockParentElement = document.createElement("div");
    Object.defineProperty(mockParentElement, "scrollTop", { writable: true, value: 0 });
    setRefCurrent(result.current.parentRef, mockParentElement);

    rerender({ listKey: "all" });
    await waitFor(() => expect(mockOnLoadNextPage).toHaveBeenCalledTimes(1));

    // Same list, same data (no new rows arrived) -> the ref guard must not request another page.
    rerender({ listKey: "all" });
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(mockOnLoadNextPage).toHaveBeenCalledTimes(1);
  });

  it("resets scroll and re-arms pagination when the list identity changes (even for a shorter list)", async () => {
    const longList = buildData(10);
    const shortList = buildData(5);

    const { result, rerender } = renderHook(
      ({ marketData, listKey }: { marketData: MarketCurrencyData[]; listKey: string }) =>
        useMarketListVirtualization({
          itemCount: marketData.length,
          marketData,
          loading: false,
          currenciesLength: marketData.length,
          listKey,
          onLoadNextPage: mockOnLoadNextPage,
          checkIfDataIsStaleAndRefetch: mockCheckIfDataIsStaleAndRefetch,
        }),
      { initialProps: { marketData: longList, listKey: "all" } },
    );

    const mockParentElement = document.createElement("div");
    Object.defineProperty(mockParentElement, "scrollTop", { writable: true, value: 500 });
    setRefCurrent(result.current.parentRef, mockParentElement);

    // First list: reaching the end advances the internal fetch guard.
    rerender({ marketData: longList, listKey: "all" });
    await waitFor(() => expect(mockOnLoadNextPage).toHaveBeenCalled());

    mockOnLoadNextPage.mockClear();

    // Switch list -> shorter data. The absolute index guard would stay stuck (10 < 5 is false);
    // the list-identity change must re-arm it and reset the scroll position to the top.
    rerender({ marketData: shortList, listKey: "infrastructure" });

    await waitFor(() => expect(mockOnLoadNextPage).toHaveBeenCalled());
    expect(mockParentElement.scrollTop).toBe(0);
  });

  it("should not call onLoadNextPage when loading is true", async () => {
    renderHook(() =>
      useMarketListVirtualization({
        itemCount: 2,
        marketData: MOCK_MARKET_CURRENCY_DATA,
        loading: true,
        currenciesLength: 2,
        listKey: "all",
        onLoadNextPage: mockOnLoadNextPage,
        checkIfDataIsStaleAndRefetch: mockCheckIfDataIsStaleAndRefetch,
      }),
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockOnLoadNextPage).not.toHaveBeenCalled();
  });

  it("should not call onLoadNextPage when currenciesLength is 0", async () => {
    renderHook(() =>
      useMarketListVirtualization({
        itemCount: 0,
        marketData: MOCK_MARKET_CURRENCY_DATA,
        loading: false,
        currenciesLength: 0,
        listKey: "all",
        onLoadNextPage: mockOnLoadNextPage,
        checkIfDataIsStaleAndRefetch: mockCheckIfDataIsStaleAndRefetch,
      }),
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockOnLoadNextPage).not.toHaveBeenCalled();
  });

  it("should call checkIfDataIsStaleAndRefetch callback with scrollTop value", async () => {
    const customCallback = jest.fn();

    const { result } = renderHook(() =>
      useMarketListVirtualization({
        itemCount: 10,
        marketData: MOCK_MARKET_CURRENCY_DATA,
        loading: false,
        currenciesLength: 2,
        listKey: "all",
        onLoadNextPage: mockOnLoadNextPage,
        checkIfDataIsStaleAndRefetch: customCallback,
      }),
    );

    const mockParentElement = document.createElement("div");
    Object.defineProperty(mockParentElement, "scrollTop", {
      writable: true,
      configurable: true,
      value: 150,
    });

    setRefCurrent(result.current.parentRef, mockParentElement);

    const capturedHandlers: Array<(event: Event) => void> = [];
    const addEventListenerSpy = jest
      .spyOn(mockParentElement, "addEventListener")
      .mockImplementation((event: string, handler: EventListenerOrEventListenerObject) => {
        if (event === "scroll" && typeof handler === "function") {
          capturedHandlers.push(handler);
        }
      });

    const { rerender } = renderHook(() =>
      useMarketListVirtualization({
        itemCount: 10,
        marketData: MOCK_MARKET_CURRENCY_DATA,
        loading: false,
        currenciesLength: 2,
        listKey: "all",
        onLoadNextPage: mockOnLoadNextPage,
        checkIfDataIsStaleAndRefetch: customCallback,
      }),
    );

    setRefCurrent(result.current.parentRef, mockParentElement);
    rerender();

    await new Promise(resolve => setTimeout(resolve, 50));

    if (capturedHandlers.length > 0) {
      const scrollEvent = new Event("scroll");
      capturedHandlers[0](scrollEvent);
      expect(customCallback).toHaveBeenCalledWith(150);
    }

    addEventListenerSpy.mockRestore();
  });
});
