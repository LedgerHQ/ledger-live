/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useAssetsData } from "../useAssetsData";
import { useGetAssetsDataInfiniteQuery } from "../../state-manager/api";

jest.mock("../../state-manager/api", () => ({
  useGetAssetsDataInfiniteQuery: jest.fn(),
}));

const mockuseGetAssetsDataInfiniteQuery = jest.mocked(useGetAssetsDataInfiniteQuery);

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
});
