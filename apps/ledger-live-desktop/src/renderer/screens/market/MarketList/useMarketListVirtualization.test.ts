/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "tests/testSetup";
import { useMarketListVirtualization } from "./useMarketListVirtualization";
import {
  mockDomMeasurements,
  setRefCurrent,
} from "~/renderer/../newArch/features/__tests__/shared";
import { mockMarketData } from "./__fixtures__/marketData";

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
        marketData: mockMarketData,
        loading: false,
        currenciesLength: 2,
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
      ({ itemCount, marketData, loading, currenciesLength }) =>
        useMarketListVirtualization({
          itemCount,
          marketData,
          loading,
          currenciesLength,
          onLoadNextPage: mockOnLoadNextPage,
          checkIfDataIsStaleAndRefetch: mockCheckIfDataIsStaleAndRefetch,
        }),
      {
        initialProps: {
          itemCount: 2,
          marketData: mockMarketData,
          loading: false,
          currenciesLength: 2,
        },
      },
    );

    const mockParentElement = document.createElement("div");
    Object.defineProperty(mockParentElement, "scrollTop", {
      writable: true,
      value: 0,
    });

    setRefCurrent(result.current.parentRef, mockParentElement);

    rerender({
      itemCount: 2,
      marketData: mockMarketData,
      loading: false,
      currenciesLength: 2,
    });

    await waitFor(() => {
      expect(mockOnLoadNextPage).toHaveBeenCalled();
    });
  });

  it("should not call onLoadNextPage when loading is true", async () => {
    renderHook(() =>
      useMarketListVirtualization({
        itemCount: 2,
        marketData: mockMarketData,
        loading: true,
        currenciesLength: 2,
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
        marketData: [],
        loading: false,
        currenciesLength: 0,
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
        marketData: mockMarketData,
        loading: false,
        currenciesLength: 2,
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
        marketData: mockMarketData,
        loading: false,
        currenciesLength: 2,
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
