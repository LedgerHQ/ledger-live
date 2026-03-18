/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useStablecoinTickers } from "../useStablecoinTickers";
import { useGetAssetsByCategoryQuery } from "../../state-manager/api";
import { AssetCategory } from "../../state-manager/types";

jest.mock("../../state-manager/api", () => ({
  useGetAssetsByCategoryQuery: jest.fn(),
}));

const hookParams = {
  product: "lld" as const,
  version: "1.0.0" as const,
};

const mockUseGetAssetsByCategoryQuery = jest.mocked(useGetAssetsByCategoryQuery);

const defaultMockValues = {
  data: undefined,
  isLoading: false,
  isFetching: false,
  isSuccess: true,
  isError: false,
  isUninitialized: false,
  error: undefined,
  refetch: jest.fn(),
  status: "fulfilled" as const,
  currentData: undefined,
  endpointName: "getAssetsByCategory" as const,
  startedTimeStamp: 0,
  fulfilledTimeStamp: 0,
  requestId: "",
};

describe("useStablecoinTickers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty set and loading true while fetching", () => {
    mockUseGetAssetsByCategoryQuery.mockReturnValue({
      ...defaultMockValues,
      isLoading: true,
      isSuccess: false,
      status: "pending" as const,
    });

    const { result } = renderHook(() =>
      useStablecoinTickers(hookParams.product, hookParams.version),
    );

    expect(result.current.tickers.size).toBe(0);
    expect(result.current.isLoading).toBe(true);
  });

  it("should return uppercased tickers when data is available", () => {
    mockUseGetAssetsByCategoryQuery.mockReturnValue({
      ...defaultMockValues,
      data: ["usdt", "usdc", "Dai"],
    });

    const { result } = renderHook(() =>
      useStablecoinTickers(hookParams.product, hookParams.version),
    );

    expect(result.current.tickers).toEqual(new Set(["USDT", "USDC", "DAI"]));
    expect(result.current.isLoading).toBe(false);
  });

  it("should return stable reference for empty set across renders", () => {
    mockUseGetAssetsByCategoryQuery.mockReturnValue(defaultMockValues);

    const { result, rerender } = renderHook(() =>
      useStablecoinTickers(hookParams.product, hookParams.version),
    );
    const firstRef = result.current.tickers;

    rerender();

    expect(result.current.tickers).toBe(firstRef);
  });

  it("should pass AssetCategory.Stablecoins to the query", () => {
    mockUseGetAssetsByCategoryQuery.mockReturnValue(defaultMockValues);

    renderHook(() => useStablecoinTickers(hookParams.product, hookParams.version));

    expect(mockUseGetAssetsByCategoryQuery).toHaveBeenCalledWith({
      category: AssetCategory.Stablecoins,
      product: hookParams.product,
      version: hookParams.version,
    });
  });
});
