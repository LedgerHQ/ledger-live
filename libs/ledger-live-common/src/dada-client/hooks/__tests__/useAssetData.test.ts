/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useAssetData } from "../useAssetData";
import { useGetAssetDataQuery } from "../../state-manager/api";

jest.mock("../../state-manager/api", () => ({
  useGetAssetDataQuery: jest.fn(),
}));

const mockUseGetAssetDataQuery = jest.mocked(useGetAssetDataQuery);

const defaultQueryResult = {
  data: undefined,
  isLoading: false,
  error: undefined,
  isSuccess: false,
  isError: false,
  isFetching: false,
  refetch: jest.fn(),
};

const baseParams = { product: "lld" as const, version: "1.0.0" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockResult = (overrides: Record<string, unknown> = {}) =>
  mockUseGetAssetDataQuery.mockReturnValue({ ...defaultQueryResult, ...overrides } as any);

describe("useAssetData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("query arguments", () => {
    it("forwards only currencyIds, product, version and isStaging", () => {
      mockResult();

      renderHook(() => useAssetData({ ...baseParams, currencyIds: ["bitcoin"], isStaging: true }));

      expect(mockUseGetAssetDataQuery).toHaveBeenCalledWith({
        currencyIds: ["bitcoin"],
        product: "lld",
        version: "1.0.0",
        isStaging: true,
      });
    });

    it("drops params the underlying query does not accept", () => {
      mockResult();

      renderHook(() =>
        useAssetData({ ...baseParams, search: "btc", useCase: "send", includeTestNetworks: true }),
      );

      expect(mockUseGetAssetDataQuery).toHaveBeenCalledWith({
        currencyIds: undefined,
        product: "lld",
        version: "1.0.0",
        isStaging: undefined,
      });
    });

    it("passes no options object, so the query is never skipped", () => {
      mockResult();

      renderHook(() => useAssetData(baseParams));

      expect(mockUseGetAssetDataQuery).toHaveBeenCalledTimes(1);
      expect(mockUseGetAssetDataQuery.mock.calls[0]).toHaveLength(1);
    });
  });

  describe("loading state collapses isLoading and isFetching", () => {
    it.each([
      [{ isLoading: true, isFetching: false }, true],
      [{ isLoading: false, isFetching: true }, true],
      [{ isLoading: true, isFetching: true }, true],
      [{ isLoading: false, isFetching: false }, false],
    ])("reports %p as isLoading %p", (flags, expected) => {
      mockResult(flags);

      const { result } = renderHook(() => useAssetData(baseParams));

      expect(result.current.isLoading).toBe(expected);
    });

    it("still reports loading while refetching with data already present", () => {
      mockResult({ data: { cryptoAssets: {} }, isFetching: true, isSuccess: true });

      const { result } = renderHook(() => useAssetData(baseParams));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toEqual({ cryptoAssets: {} });
    });
  });

  describe("passthrough", () => {
    it("passes data, success and refetch straight through", () => {
      const refetch = jest.fn();
      const data = { cryptoAssets: { bitcoin: {} } };
      mockResult({ data, isSuccess: true, refetch });

      const { result } = renderHook(() => useAssetData(baseParams));

      expect(result.current.data).toBe(data);
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.refetch).toBe(refetch);
    });

    it("passes the raw error through without parsing it", () => {
      const error = { status: 500, data: "boom" };
      mockResult({ error, isError: true });

      const { result } = renderHook(() => useAssetData(baseParams));

      expect(result.current.error).toBe(error);
      expect(result.current.isError).toBe(true);
    });

    it("does not expose errorInfo or isFetching", () => {
      mockResult({ isFetching: true, error: { status: 500 } });

      const { result } = renderHook(() => useAssetData(baseParams));

      expect(result.current).not.toHaveProperty("errorInfo");
      expect(result.current).not.toHaveProperty("isFetching");
    });
  });
});
