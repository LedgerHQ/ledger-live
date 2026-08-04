/**
 * @jest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { useStockAssetIds } from "../useStockAssetIds";
import { useGetAssetCurrencyIdsByCategoryQuery } from "../../state-manager/api";
import { AssetCategory } from "../../state-manager/types";

jest.mock("../../state-manager/api", () => ({
  useGetAssetCurrencyIdsByCategoryQuery: jest.fn(),
}));

const mockQuery = jest.mocked(useGetAssetCurrencyIdsByCategoryQuery);

const defaultQueryResult = { data: undefined, isLoading: false, isError: false };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockResult = (overrides: Record<string, unknown> = {}) =>
  mockQuery.mockReturnValue({ ...defaultQueryResult, ...overrides } as any);

describe("useStockAssetIds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("query arguments", () => {
    it("always requests the stocks category", () => {
      mockResult();

      renderHook(() => useStockAssetIds("lld", "1.0.0"));

      expect(mockQuery).toHaveBeenCalledWith(
        { category: AssetCategory.Stocks, product: "lld", version: "1.0.0" },
        { skip: undefined },
      );
    });

    it("forwards the skip flag", () => {
      mockResult();

      renderHook(() => useStockAssetIds("llm", "2.0.0", true));

      expect(mockQuery).toHaveBeenCalledWith(
        { category: AssetCategory.Stocks, product: "llm", version: "2.0.0" },
        { skip: true },
      );
    });

    it("does not forward an isStaging flag", () => {
      mockResult();

      renderHook(() => useStockAssetIds("lld", "1.0.0"));

      expect(mockQuery.mock.calls[0][0]).not.toHaveProperty("isStaging");
    });
  });

  describe("ids", () => {
    it("wraps the returned ids in a Set", () => {
      mockResult({ data: ["applex", "teslax"] });

      const { result } = renderHook(() => useStockAssetIds("lld", "1.0.0"));

      expect(result.current.ids).toBeInstanceOf(Set);
      expect([...result.current.ids]).toEqual(["applex", "teslax"]);
    });

    it("does not upper-case the ids, unlike the stablecoin ticker hook", () => {
      mockResult({ data: ["applex"] });

      const { result } = renderHook(() => useStockAssetIds("lld", "1.0.0"));

      expect(result.current.ids.has("applex")).toBe(true);
      expect(result.current.ids.has("APPLEX")).toBe(false);
    });

    it("deduplicates repeated ids", () => {
      mockResult({ data: ["applex", "applex", "teslax"] });

      const { result } = renderHook(() => useStockAssetIds("lld", "1.0.0"));

      expect(result.current.ids.size).toBe(2);
    });

    it("returns an empty set when there is no data", () => {
      mockResult({ data: undefined });

      const { result } = renderHook(() => useStockAssetIds("lld", "1.0.0"));

      expect(result.current.ids.size).toBe(0);
    });

    it("returns an empty set for an empty array", () => {
      mockResult({ data: [] });

      const { result } = renderHook(() => useStockAssetIds("lld", "1.0.0"));

      expect(result.current.ids.size).toBe(0);
    });

    it("shares one stable empty-set reference across hook instances without data", () => {
      mockResult({ data: undefined });

      const first = renderHook(() => useStockAssetIds("lld", "1.0.0"));
      const second = renderHook(() => useStockAssetIds("llm", "2.0.0"));

      expect(first.result.current.ids).toBe(second.result.current.ids);
    });

    it("keeps the same set reference across re-renders with unchanged data", () => {
      const data = ["applex"];
      mockResult({ data });

      const { result, rerender } = renderHook(() => useStockAssetIds("lld", "1.0.0"));
      const firstSet = result.current.ids;
      rerender();

      expect(result.current.ids).toBe(firstSet);
    });
  });

  describe("status passthrough", () => {
    it("reports loading", () => {
      mockResult({ isLoading: true });

      const { result } = renderHook(() => useStockAssetIds("lld", "1.0.0"));

      expect(result.current.isLoading).toBe(true);
    });

    it("reports errors and still returns an empty set", () => {
      mockResult({ isError: true });

      const { result } = renderHook(() => useStockAssetIds("lld", "1.0.0"));

      expect(result.current.isError).toBe(true);
      expect(result.current.ids.size).toBe(0);
    });

    it("exposes only ids, isLoading and isError", () => {
      mockResult({ data: ["applex"] });

      const { result } = renderHook(() => useStockAssetIds("lld", "1.0.0"));

      expect(Object.keys(result.current).sort()).toEqual(["ids", "isError", "isLoading"]);
    });
  });
});
