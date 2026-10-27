/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useAssetsData } from "./useAssetsData";
import { AssetCategory, useGetAssetsDataInfiniteQuery } from "@domain/api-aggregated-assets";

jest.mock("@domain/api-aggregated-assets", () => ({
  ...jest.requireActual("@domain/api-aggregated-assets"),
  useGetAssetsDataInfiniteQuery: jest.fn(),
}));

const mockuseGetAssetsDataInfiniteQuery = jest.mocked(useGetAssetsDataInfiniteQuery);

function catalogPage(id: "bitcoin" | "ethereum") {
  const name = id === "bitcoin" ? "Bitcoin" : "Ethereum";
  return {
    cryptoAssets: { [id]: { id, name } },
    networks: { [id]: { id, name } },
    cryptoOrTokenCurrencies: { [id]: { id } },
    interestRates: {},
    markets: {},
    currenciesOrder: {
      metaCurrencyIds: [id],
      key: "marketCap",
      order: "desc" as const,
    },
    pagination: { nextCursor: undefined },
  };
}

const defaultMockValues = {
  data: undefined,
  isLoading: false,
  error: undefined,
  fetchNextPage: jest.fn(),
  isSuccess: true,
  isFetching: false,
  isError: false,
  fetchPreviousPage: jest.fn(),
  isFetchingPreviousPage: false,
  refetch: jest.fn(),
  status: "success",
};

describe("useAssetsData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should treat retained data as not ready for the current query", () => {
    mockuseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      data: { pages: [], pageParams: [] },
      currentData: undefined,
    });

    const retained = renderHook(() => useAssetsData({ product: "lld", version: "1.0.0" }));
    expect(retained.result.current.isCurrentResultReady).toBe(false);

    mockuseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      currentData: { pages: [], pageParams: [] },
    });

    const ready = renderHook(() => useAssetsData({ product: "lld", version: "1.0.0" }));
    expect(ready.result.current.isCurrentResultReady).toBe(true);
  });

  it("should merge the current cached pages when a refetch still exposes the previous query", () => {
    const previousPage = catalogPage("bitcoin");
    const currentPage = catalogPage("ethereum");

    mockuseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      data: { pages: [previousPage], pageParams: [{ cursor: "" }] },
      currentData: { pages: [currentPage], pageParams: [{ cursor: "" }] },
      isFetching: true,
    });

    const { result } = renderHook(() => useAssetsData({ product: "lld", version: "1.0.0" }));

    expect(result.current.isCurrentResultReady).toBe(true);
    expect(result.current.data?.cryptoAssets).toEqual({
      ethereum: { id: "ethereum", name: "Ethereum" },
    });
  });

  it("should keep the previous pages for display when the current query has no result", () => {
    mockuseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      data: { pages: [catalogPage("bitcoin")], pageParams: [{ cursor: "" }] },
      currentData: undefined,
      isFetching: true,
    });

    const { result } = renderHook(() => useAssetsData({ product: "lld", version: "1.0.0" }));

    expect(result.current.isCurrentResultReady).toBe(false);
    expect(result.current.data?.cryptoAssets).toEqual({
      bitcoin: { id: "bitcoin", name: "Bitcoin" },
    });
  });

  it("should return loading state when API is loading", () => {
    mockuseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      isLoading: true,
      status: "pending",
    });

    const { result } = renderHook(() => useAssetsData({ product: "lld", version: "1.0.0" }));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBe(undefined);
  });

  it("should return combined data from multiple pages", () => {
    const mockPages = [
      {
        cryptoAssets: { bitcoin: { id: "bitcoin", name: "Bitcoin" } },
        networks: { bitcoin: { id: "bitcoin", name: "Bitcoin" } },
        cryptoOrTokenCurrencies: { bitcoin: { id: "bitcoin" } },
        interestRates: {},
        markets: {},
        currenciesOrder: {
          metaCurrencyIds: ["bitcoin"],
          key: "marketCap",
          order: "desc",
        },
        pagination: { nextCursor: "cursor-2" },
      },
      {
        cryptoAssets: { ethereum: { id: "ethereum", name: "Ethereum" } },
        networks: { ethereum: { id: "ethereum", name: "Ethereum" } },
        cryptoOrTokenCurrencies: { ethereum: { id: "ethereum" } },
        interestRates: {},
        markets: {},
        currenciesOrder: {
          metaCurrencyIds: ["ethereum"],
          key: "marketCap",
          order: "desc",
        },
        pagination: { nextCursor: undefined },
      },
    ];

    mockuseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      data: { pages: mockPages, pageParams: [{ cursor: "" }, { cursor: "cursor-2" }] },
    });

    const { result } = renderHook(() => useAssetsData({ product: "lld", version: "1.0.0" }));

    expect(result.current.data).toEqual({
      cryptoAssets: {
        bitcoin: { id: "bitcoin", name: "Bitcoin" },
        ethereum: { id: "ethereum", name: "Ethereum" },
      },
      networks: {
        bitcoin: { id: "bitcoin", name: "Bitcoin" },
        ethereum: { id: "ethereum", name: "Ethereum" },
      },
      cryptoOrTokenCurrencies: {
        bitcoin: { id: "bitcoin" },
        ethereum: { id: "ethereum" },
      },
      interestRates: {},
      markets: {},
      currenciesOrder: {
        metaCurrencyIds: ["bitcoin", "ethereum"],
        key: "marketCap",
        order: "desc",
      },
      pagination: { nextCursor: undefined },
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("should return error when API has error", () => {
    const mockError = new Error("API Error");
    mockuseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      data: undefined,
      error: mockError,
      isSuccess: false,
      isError: true,
      status: "error",
    });

    const { result } = renderHook(() => useAssetsData({ product: "lld", version: "1.0.0" }));

    expect(result.current.error).toBe(mockError);
    expect(result.current.isLoading).toBe(false);
  });

  it("should provide loadNext function when there's a nextCursor", () => {
    const mockFetchNextPage = jest.fn();
    const mockPages = [
      {
        cryptoAssets: {},
        networks: {},
        cryptoOrTokenCurrencies: {},
        interestRates: {},
        markets: {},
        currenciesOrder: {
          metaCurrencyIds: [],
          key: "marketCap",
          order: "desc",
        },
        pagination: { nextCursor: "next-cursor-456" },
      },
    ];

    mockuseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      data: { pages: mockPages, pageParams: [{ cursor: "" }] },
      fetchNextPage: mockFetchNextPage,
    });

    const { result } = renderHook(() => useAssetsData({ product: "lld", version: "1.0.0" }));

    expect(result.current.loadNext).toBeDefined();
    result.current.loadNext?.();

    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it("should not provide loadNext function when there's no nextCursor", () => {
    const mockPages = [
      {
        cryptoAssets: {},
        networks: {},
        cryptoOrTokenCurrencies: {},
        interestRates: {},
        markets: {},
        currenciesOrder: {
          metaCurrencyIds: [],
          key: "marketCap",
          order: "desc",
        },
        pagination: { nextCursor: undefined },
      },
    ];

    mockuseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      data: { pages: mockPages, pageParams: [{ cursor: "" }] },
    });

    const { result } = renderHook(() => useAssetsData({ product: "lld", version: "1.0.0" }));

    expect(result.current.loadNext).toBeUndefined();
  });

  it("should return undefined data when no pages exist", () => {
    mockuseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
    });

    const { result } = renderHook(() => useAssetsData({ product: "lld", version: "1.0.0" }));

    expect(result.current.data).toBeUndefined();
    expect(result.current.loadNext).toBeUndefined();
  });

  it("should forward polling options to the underlying query", () => {
    mockuseGetAssetsDataInfiniteQuery.mockReturnValue({ ...defaultMockValues });

    renderHook(() =>
      useAssetsData({
        product: "lld",
        version: "1.0.0",
        pollingInterval: 60_000,
        skipPollingIfUnfocused: true,
      }),
    );

    expect(mockuseGetAssetsDataInfiniteQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ pollingInterval: 60_000, skipPollingIfUnfocused: true }),
    );
  });

  it("should not poll by default", () => {
    mockuseGetAssetsDataInfiniteQuery.mockReturnValue({ ...defaultMockValues });

    renderHook(() => useAssetsData({ product: "lld", version: "1.0.0" }));

    expect(mockuseGetAssetsDataInfiniteQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ pollingInterval: undefined }),
    );
  });

  it("should forward category filtering to the underlying query", () => {
    mockuseGetAssetsDataInfiniteQuery.mockReturnValue({ ...defaultMockValues });

    renderHook(() =>
      useAssetsData({
        product: "lld",
        version: "1.0.0",
        categories: [AssetCategory.Stablecoins],
      }),
    );

    expect(mockuseGetAssetsDataInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({ categories: [AssetCategory.Stablecoins] }),
      expect.anything(),
    );
  });
});
