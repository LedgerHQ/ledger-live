/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useStocksData } from "../useStocksData";
import { useGetAssetsDataInfiniteQuery } from "../../state-manager/api";
import { AssetCategory } from "../../state-manager/types";

jest.mock("../../state-manager/api", () => ({
  useGetAssetsDataInfiniteQuery: jest.fn(),
}));

const mockUseGetAssetsDataInfiniteQuery = jest.mocked(useGetAssetsDataInfiniteQuery);

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

const makePage = (overrides: Record<string, unknown> = {}) => ({
  cryptoAssets: {},
  networks: {},
  cryptoOrTokenCurrencies: {},
  interestRates: {},
  markets: {},
  currenciesOrder: { metaCurrencyIds: [], key: "marketCap", order: "desc" },
  pagination: { nextCursor: undefined },
  ...overrides,
});

describe("useStocksData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("forwards the stocks category to the underlying query", () => {
    mockUseGetAssetsDataInfiniteQuery.mockReturnValue({ ...defaultMockValues });

    renderHook(() => useStocksData({ product: "lld", version: "1.0.0" }));

    expect(mockUseGetAssetsDataInfiniteQuery).toHaveBeenCalledWith(
      expect.objectContaining({ categories: [AssetCategory.Stocks] }),
      expect.anything(),
    );
  });

  it("returns loading state when the query is loading", () => {
    mockUseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      isLoading: true,
      status: "pending",
    });

    const { result } = renderHook(() => useStocksData({ product: "lld", version: "1.0.0" }));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("merges multiple pages and preserves DADA sort order", () => {
    const mockPages = [
      makePage({
        cryptoAssets: { applex: { id: "applex", name: "Apple xStock" } },
        currenciesOrder: { metaCurrencyIds: ["applex"], key: "marketCap", order: "desc" },
        pagination: { nextCursor: "cursor-2" },
      }),
      makePage({
        cryptoAssets: { teslax: { id: "teslax", name: "Tesla xStock" } },
        currenciesOrder: { metaCurrencyIds: ["teslax"], key: "marketCap", order: "desc" },
        pagination: { nextCursor: undefined },
      }),
    ];

    mockUseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      data: { pages: mockPages, pageParams: [{ cursor: "" }, { cursor: "cursor-2" }] },
    });

    const { result } = renderHook(() => useStocksData({ product: "lld", version: "1.0.0" }));

    expect(result.current.data?.cryptoAssets).toEqual({
      applex: { id: "applex", name: "Apple xStock" },
      teslax: { id: "teslax", name: "Tesla xStock" },
    });
    expect(result.current.data?.currenciesOrder).toEqual({
      metaCurrencyIds: ["applex", "teslax"],
      key: "marketCap",
      order: "desc",
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("passes through query errors", () => {
    const mockError = new Error("API Error");
    mockUseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      error: mockError,
      isSuccess: false,
      isError: true,
      status: "error",
    });

    const { result } = renderHook(() => useStocksData({ product: "lld", version: "1.0.0" }));

    expect(result.current.error).toBe(mockError);
    expect(result.current.isError).toBe(true);
  });

  it("exposes loadNext only when a nextCursor is present", () => {
    const mockFetchNextPage = jest.fn();
    mockUseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      data: {
        pages: [makePage({ pagination: { nextCursor: "next-cursor" } })],
        pageParams: [{ cursor: "" }],
      },
      fetchNextPage: mockFetchNextPage,
    });

    const { result } = renderHook(() => useStocksData({ product: "lld", version: "1.0.0" }));

    expect(result.current.loadNext).toBeDefined();
    result.current.loadNext?.();
    expect(mockFetchNextPage).toHaveBeenCalled();
  });

  it("does not expose loadNext when there is no nextCursor", () => {
    mockUseGetAssetsDataInfiniteQuery.mockReturnValue({
      ...defaultMockValues,
      data: { pages: [makePage()], pageParams: [{ cursor: "" }] },
    });

    const { result } = renderHook(() => useStocksData({ product: "lld", version: "1.0.0" }));

    expect(result.current.loadNext).toBeUndefined();
  });
});
