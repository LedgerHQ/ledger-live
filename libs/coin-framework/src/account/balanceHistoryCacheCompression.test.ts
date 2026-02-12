import {
  compressBalanceHistoryDataCache,
  decompressBalanceHistoryDataCache,
  compressBalanceHistoryCache,
  decompressBalanceHistoryCache,
} from "./balanceHistoryCacheCompression";
import type {
  BalanceHistoryDataCache,
  BalanceHistoryCache,
  CompressedBalanceHistoryDataCache,
  CompressedBalanceHistoryCache,
} from "@ledgerhq/types-live";

describe("balanceHistoryCacheCompression", () => {
  describe("compressBalanceHistoryDataCache", () => {
    it("should compress empty cache", () => {
      const cache: BalanceHistoryDataCache = {
        latestDate: null,
        balances: [],
      };

      const compressed = compressBalanceHistoryDataCache(cache);

      expect(compressed).toEqual({
        latestDate: null,
        balances: [],
      });
    });

    it("should compress cache with single value", () => {
      const cache: BalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [1234567890],
      };

      const compressed = compressBalanceHistoryDataCache(cache);

      expect(compressed).toEqual({
        latestDate: 1000000,
        balances: [1234567890],
      });
    });

    it("should compress cache with unchanged balances using RLE", () => {
      const cache: BalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [1000000, 1000000, 1000000, 1000000, 1000000],
      };

      const compressed = compressBalanceHistoryDataCache(cache);

      // RLE for 5 identical values
      expect(compressed.balances).toEqual([[1000000, 5]]);
    });

    it("should compress cache with incremental changes", () => {
      const cache: BalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [1000000, 1000000, 1000500, 1000500, 1001000],
      };

      const compressed = compressBalanceHistoryDataCache(cache);

      // RLE for 2 identical, then RLE for 2 identical, then single value
      expect(compressed.balances).toEqual([[1000000, 2], [1000500, 2], 1001000]);
    });

    it("should use RLE for sequences of 2+ identical values", () => {
      const cache: BalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [1000000, 1000000, 1000000, 1000000, 1000500, 1000500, 1000500, 1001000],
      };

      const compressed = compressBalanceHistoryDataCache(cache);

      // RLE for 4 identical, then RLE for 3 identical, then single value
      expect(compressed.balances).toEqual([[1000000, 4], [1000500, 3], 1001000]);
    });

    it("should compress cache with decreasing balances", () => {
      const cache: BalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [1000000, 999500, 999000, 998500],
      };

      const compressed = compressBalanceHistoryDataCache(cache);

      // All different values, no RLE
      expect(compressed.balances).toEqual([1000000, 999500, 999000, 998500]);
    });

    it("should handle zero values", () => {
      const cache: BalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [0, 0, 0, 100, 0, 0],
      };

      const compressed = compressBalanceHistoryDataCache(cache);

      expect(compressed.balances).toEqual([[0, 3], 100, [0, 2]]);
    });

    it("should handle negative values", () => {
      const cache: BalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [-100, -100, -50, -50],
      };

      const compressed = compressBalanceHistoryDataCache(cache);

      expect(compressed.balances).toEqual([
        [-100, 2],
        [-50, 2],
      ]);
    });

    it("should handle alternating values (no RLE)", () => {
      const cache: BalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [100, 200, 100, 200, 100],
      };

      const compressed = compressBalanceHistoryDataCache(cache);

      // No consecutive identical values, all stored individually
      expect(compressed.balances).toEqual([100, 200, 100, 200, 100]);
    });

    it("should handle very large sequences", () => {
      const cache: BalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: new Array(1000).fill(123456789),
      };

      const compressed = compressBalanceHistoryDataCache(cache);

      expect(compressed.balances).toEqual([[123456789, 1000]]);
    });
  });

  describe("decompressBalanceHistoryDataCache", () => {
    it("should decompress empty cache", () => {
      const compressed = {
        latestDate: null,
        balances: [],
      };

      const decompressed = decompressBalanceHistoryDataCache(compressed);

      expect(decompressed).toEqual({
        latestDate: null,
        balances: [],
      });
    });

    it("should return empty cache for undefined (avoids reading .balances)", () => {
      const decompressed = decompressBalanceHistoryDataCache(undefined);
      expect(decompressed).toEqual({ latestDate: undefined, balances: [] });
    });

    it("should return empty cache for null", () => {
      const decompressed = decompressBalanceHistoryDataCache(null);
      expect(decompressed).toEqual({ latestDate: undefined, balances: [] });
    });

    it("should return empty cache for empty object {}", () => {
      const decompressed = decompressBalanceHistoryDataCache(
        {} as CompressedBalanceHistoryDataCache,
      );
      expect(decompressed).toEqual({ latestDate: undefined, balances: [] });
    });

    it("should decompress cache with single value", () => {
      const compressed = {
        latestDate: 1000000,
        balances: [1234567890],
      };

      const decompressed = decompressBalanceHistoryDataCache(compressed);

      expect(decompressed).toEqual({
        latestDate: 1000000,
        balances: [1234567890],
      });
    });

    it("should decompress cache with mixed values", () => {
      const compressed: CompressedBalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [[1000000, 2], [1000500, 2], 1001000],
      };

      const decompressed = decompressBalanceHistoryDataCache(compressed);

      expect(decompressed).toEqual({
        latestDate: 1000000,
        balances: [1000000, 1000000, 1000500, 1000500, 1001000],
      });
    });

    it("should decompress cache with RLE entries", () => {
      const compressed: CompressedBalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [[1000000, 5]],
      };

      const decompressed = decompressBalanceHistoryDataCache(compressed);

      expect(decompressed).toEqual({
        latestDate: 1000000,
        balances: [1000000, 1000000, 1000000, 1000000, 1000000],
      });
    });

    it("should decompress cache with mixed RLE and regular entries", () => {
      const compressed: CompressedBalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [[1000000, 4], [1000500, 3], 1001000],
      };

      const decompressed = decompressBalanceHistoryDataCache(compressed);

      expect(decompressed).toEqual({
        latestDate: 1000000,
        balances: [1000000, 1000000, 1000000, 1000000, 1000500, 1000500, 1000500, 1001000],
      });
    });

    it("should decompress cache with backward compatibility (uncompressed)", () => {
      const uncompressed: BalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [1000000, 999500, 999000, 998500],
      };

      const decompressed = decompressBalanceHistoryDataCache(uncompressed);

      // Should handle uncompressed format (backward compatibility)
      expect(decompressed).toEqual(uncompressed);
    });

    it("should handle zero values in decompression", () => {
      const compressed: CompressedBalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [[0, 3], 100, [0, 2]],
      };

      const decompressed = decompressBalanceHistoryDataCache(compressed);

      expect(decompressed.balances).toEqual([0, 0, 0, 100, 0, 0]);
    });

    it("should handle negative values in decompression", () => {
      const compressed: CompressedBalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [
          [-100, 2],
          [-50, 2],
        ],
      };

      const decompressed = decompressBalanceHistoryDataCache(compressed);

      expect(decompressed.balances).toEqual([-100, -100, -50, -50]);
    });

    it("should handle very large RLE counts", () => {
      const compressed: CompressedBalanceHistoryDataCache = {
        latestDate: 1000000,
        balances: [[123456789, 1000]],
      };

      const decompressed = decompressBalanceHistoryDataCache(compressed);

      expect(decompressed.balances).toEqual(new Array(1000).fill(123456789));
    });
  });

  describe("round-trip compression", () => {
    it("should preserve data through compress/decompress cycle", () => {
      const original: BalanceHistoryDataCache = {
        latestDate: 1234567890,
        balances: [1000000, 1000000, 1000000, 1000500, 1000500, 1001000, 999500],
      };

      const compressed = compressBalanceHistoryDataCache(original);
      const decompressed = decompressBalanceHistoryDataCache(compressed);

      expect(decompressed).toEqual(original);
    });

    it("should preserve data with large numbers", () => {
      const original: BalanceHistoryDataCache = {
        latestDate: 1234567890,
        balances: [123456789012345, 123456789012345, 123456789012345, 123456789012845],
      };

      const compressed = compressBalanceHistoryDataCache(original);
      const decompressed = decompressBalanceHistoryDataCache(compressed);

      expect(decompressed).toEqual(original);
    });

    it("should preserve data with many unchanged values", () => {
      const original: BalanceHistoryDataCache = {
        latestDate: 1234567890,
        balances: new Array(100).fill(1000000),
      };

      const compressed = compressBalanceHistoryDataCache(original);
      const decompressed = decompressBalanceHistoryDataCache(compressed);

      expect(decompressed).toEqual(original);
    });

    it("should preserve data with zero values", () => {
      const original: BalanceHistoryDataCache = {
        latestDate: 1234567890,
        balances: [0, 0, 100, 0, 0, 0],
      };

      const compressed = compressBalanceHistoryDataCache(original);
      const decompressed = decompressBalanceHistoryDataCache(compressed);

      expect(decompressed).toEqual(original);
    });

    it("should preserve data with negative values", () => {
      const original: BalanceHistoryDataCache = {
        latestDate: 1234567890,
        balances: [-100, -100, -50, -50, 0],
      };

      const compressed = compressBalanceHistoryDataCache(original);
      const decompressed = decompressBalanceHistoryDataCache(compressed);

      expect(decompressed).toEqual(original);
    });
  });

  describe("compressBalanceHistoryCache", () => {
    it("should compress all granularities", () => {
      const cache: BalanceHistoryCache = {
        HOUR: {
          latestDate: 1000,
          balances: [100, 100, 100],
        },
        DAY: {
          latestDate: 2000,
          balances: [200, 200, 200],
        },
        WEEK: {
          latestDate: 3000,
          balances: [300, 300, 300],
        },
      };

      const compressed = compressBalanceHistoryCache(cache);

      expect(compressed.HOUR.balances).toEqual([[100, 3]]);
      expect(compressed.DAY.balances).toEqual([[200, 3]]);
      expect(compressed.WEEK.balances).toEqual([[300, 3]]);
    });
  });

  describe("decompressBalanceHistoryCache", () => {
    it("should decompress all granularities", () => {
      const compressed: CompressedBalanceHistoryCache = {
        HOUR: {
          latestDate: 1000,
          balances: [[100, 3]],
        },
        DAY: {
          latestDate: 2000,
          balances: [[200, 3]],
        },
        WEEK: {
          latestDate: 3000,
          balances: [[300, 3]],
        },
      };

      const decompressed = decompressBalanceHistoryCache(compressed);

      expect(decompressed.HOUR.balances).toEqual([100, 100, 100]);
      expect(decompressed.DAY.balances).toEqual([200, 200, 200]);
      expect(decompressed.WEEK.balances).toEqual([300, 300, 300]);
    });

    it("should handle backward compatibility with uncompressed format", () => {
      const uncompressed: BalanceHistoryCache = {
        HOUR: {
          latestDate: 1000,
          balances: [100, 100, 100],
        },
        DAY: {
          latestDate: 2000,
          balances: [200, 200, 200],
        },
        WEEK: {
          latestDate: 3000,
          balances: [300, 300, 300],
        },
      };

      const result = decompressBalanceHistoryCache(uncompressed);

      expect(result).toEqual(uncompressed);
    });

    it("should return empty cache for undefined (e.g. from empty balanceHistoryCache: {})", () => {
      const result = decompressBalanceHistoryCache(undefined);
      expect(result.HOUR).toEqual({ latestDate: undefined, balances: [] });
      expect(result.DAY).toEqual({ latestDate: undefined, balances: [] });
      expect(result.WEEK).toEqual({ latestDate: undefined, balances: [] });
    });

    it("should return empty cache for null", () => {
      const result = decompressBalanceHistoryCache(null);
      expect(result.HOUR.balances).toEqual([]);
      expect(result.DAY.balances).toEqual([]);
      expect(result.WEEK.balances).toEqual([]);
    });

    it("should return empty granularities for empty object (legacy stored balanceHistoryCache: {})", () => {
      const result = decompressBalanceHistoryCache({} as CompressedBalanceHistoryCache);
      expect(result.HOUR).toEqual({ latestDate: undefined, balances: [] });
      expect(result.DAY).toEqual({ latestDate: undefined, balances: [] });
      expect(result.WEEK).toEqual({ latestDate: undefined, balances: [] });
    });
  });
});
