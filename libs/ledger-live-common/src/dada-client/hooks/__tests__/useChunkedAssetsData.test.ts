/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useChunkedAssetsData } from "../useChunkedAssetsData";
import { useGetChunkedAssetsDataQuery } from "../../state-manager/api";

jest.mock("../../state-manager/api", () => ({
  useGetChunkedAssetsDataQuery: jest.fn(),
}));

const mockUseGetChunkedAssetsDataQuery = jest.mocked(useGetChunkedAssetsDataQuery);

const defaultQueryResult = {
  data: undefined,
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: undefined,
  isFetching: false,
  refetch: jest.fn(),
};

const baseParams = { product: "lld" as const, version: "1.0.0" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockResult = (overrides: Record<string, unknown> = {}) =>
  mockUseGetChunkedAssetsDataQuery.mockReturnValue({
    ...defaultQueryResult,
    ...overrides,
  } as any);

describe("useChunkedAssetsData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("query arguments", () => {
    it("separates skip from the query args", () => {
      mockResult();

      renderHook(() =>
        useChunkedAssetsData({ ...baseParams, currencyIds: ["bitcoin"], skip: true }),
      );

      expect(mockUseGetChunkedAssetsDataQuery).toHaveBeenCalledWith(
        { product: "lld", version: "1.0.0", currencyIds: ["bitcoin"] },
        { skip: true },
      );
    });

    it("forwards every other param unchanged", () => {
      mockResult();

      renderHook(() =>
        useChunkedAssetsData({
          ...baseParams,
          currencyIds: ["bitcoin", "ethereum"],
          useCase: "send",
          isStaging: true,
          includeTestNetworks: true,
        }),
      );

      expect(mockUseGetChunkedAssetsDataQuery).toHaveBeenCalledWith(
        {
          product: "lld",
          version: "1.0.0",
          currencyIds: ["bitcoin", "ethereum"],
          useCase: "send",
          isStaging: true,
          includeTestNetworks: true,
        },
        { skip: undefined },
      );
    });

    it("passes skip as undefined when it is not provided", () => {
      mockResult();

      renderHook(() => useChunkedAssetsData(baseParams));

      expect(mockUseGetChunkedAssetsDataQuery).toHaveBeenCalledWith(baseParams, {
        skip: undefined,
      });
    });
  });

  describe("loading state suppresses refetch flicker", () => {
    it("reports loading on the initial fetch", () => {
      mockResult({ isLoading: true });

      const { result } = renderHook(() => useChunkedAssetsData(baseParams));

      expect(result.current.isLoading).toBe(true);
    });

    it("reports loading while fetching with no data yet", () => {
      mockResult({ isFetching: true });

      const { result } = renderHook(() => useChunkedAssetsData(baseParams));

      expect(result.current.isLoading).toBe(true);
    });

    it("does NOT report loading while refetching when data is already present", () => {
      mockResult({ isFetching: true, data: { cryptoAssets: {} }, isSuccess: true });

      const { result } = renderHook(() => useChunkedAssetsData(baseParams));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual({ cryptoAssets: {} });
    });

    it("is not loading when idle", () => {
      mockResult({ isSuccess: true, data: { cryptoAssets: {} } });

      const { result } = renderHook(() => useChunkedAssetsData(baseParams));

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("error reporting", () => {
    it("exposes both the raw error and a parsed errorInfo", () => {
      const error = { status: 500, data: "boom" };
      mockResult({ error, isError: true });

      const { result } = renderHook(() => useChunkedAssetsData(baseParams));

      expect(result.current.error).toBe(error);
      expect(result.current.errorInfo).toEqual({
        hasError: true,
        isNetworkError: false,
        isApiError: true,
        apiStatus: 500,
      });
    });

    it("classifies a fetch failure as a network error with no status", () => {
      mockResult({ error: { status: "FETCH_ERROR", error: "offline" }, isError: true });

      const { result } = renderHook(() => useChunkedAssetsData(baseParams));

      expect(result.current.errorInfo).toEqual({
        hasError: true,
        isNetworkError: true,
        isApiError: false,
        apiStatus: undefined,
      });
    });

    it("still produces an errorInfo when there is no error", () => {
      mockResult({ isSuccess: true });

      const { result } = renderHook(() => useChunkedAssetsData(baseParams));

      expect(result.current.errorInfo).toEqual({
        hasError: false,
        isNetworkError: false,
        isApiError: false,
        apiStatus: undefined,
      });
    });
  });

  it("passes refetch straight through", () => {
    const refetch = jest.fn();
    mockResult({ refetch });

    const { result } = renderHook(() => useChunkedAssetsData(baseParams));

    expect(result.current.refetch).toBe(refetch);
  });
});
