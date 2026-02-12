/**
 * Compression utilities for BalanceHistoryCache
 *
 * This module provides compression/decompression functions to reduce
 * the storage size of balance history cache in app.json.
 *
 * Strategy: Run-Length Encoding (RLE) on absolute values
 * - If a value repeats 2+ times: store as [value, count]
 * - Otherwise: store the value directly
 *
 * Format:
 * - balances array contains numbers or RLE tuples [value, count]
 * - All values are absolute (no delta encoding to preserve precision)
 */

import type {
  BalanceHistoryCache,
  BalanceHistoryDataCache,
  CompressedBalanceHistoryCache,
  CompressedBalanceHistoryDataCache,
  CompressedBalanceEntry,
} from "@ledgerhq/types-live";

// Re-export types for convenience
export type {
  CompressedBalanceHistoryCache,
  CompressedBalanceHistoryDataCache,
  CompressedBalanceEntry,
};

/**
 * Check if an entry is an RLE tuple [value, count]
 */
function isRLEEntry(entry: CompressedBalanceEntry): entry is [number, number] {
  return Array.isArray(entry) && entry.length === 2;
}

/**
 * Compress a single BalanceHistoryDataCache using RLE on absolute values
 *
 * @param cache - The cache to compress
 * @returns Compressed cache with RLE-compressed balances
 * @example
 * // Input: [1000000, 1000000, 1000000, 1000500, 1000500]
 * // Output: [[1000000, 3], [1000500, 2]]
 * compressBalanceHistoryDataCache({
 *   latestDate: 1234567890,
 *   balances: [1000000, 1000000, 1000000, 1000500, 1000500]
 * })
 */
export function compressBalanceHistoryDataCache(
  cache: BalanceHistoryDataCache,
): CompressedBalanceHistoryDataCache {
  if (!cache?.balances || cache.balances.length === 0) {
    return {
      latestDate: cache?.latestDate,
      balances: [],
    };
  }

  const compressed: CompressedBalanceEntry[] = [];
  let i = 0;

  while (i < cache.balances.length) {
    const value = cache.balances[i];
    let count = 1;

    // Count consecutive identical values
    while (i + count < cache.balances.length && cache.balances[i + count] === value) {
      count++;
    }

    // Use RLE for sequences of 2+ identical values
    if (count >= 2) {
      compressed.push([value, count]);
    } else {
      // Store individual value
      compressed.push(value);
    }
    i += count;
  }

  return {
    latestDate: cache.latestDate,
    balances: compressed,
  };
}

/**
 * Decompress a CompressedBalanceHistoryDataCache back to BalanceHistoryDataCache
 * Handles backward compatibility with uncompressed format (array of absolute numbers)
 *
 * @param data - The compressed cache (or uncompressed for backward compatibility)
 * @returns Decompressed cache with absolute balances
 * @example
 * // Input: [[1000000, 3], [1000500, 2]]
 * // Output: [1000000, 1000000, 1000000, 1000500, 1000500]
 * decompressBalanceHistoryDataCache({
 *   latestDate: 1234567890,
 *   balances: [[1000000, 3], [1000500, 2]]
 * })
 */
export function decompressBalanceHistoryDataCache(
  data: CompressedBalanceHistoryDataCache | BalanceHistoryDataCache | null | undefined,
): BalanceHistoryDataCache {
  if (data == null || typeof data !== "object") {
    return { latestDate: undefined, balances: [] };
  }
  if (!data.balances || !Array.isArray(data.balances) || data.balances.length === 0) {
    return {
      latestDate: data.latestDate,
      balances: [],
    };
  }

  // Single pass: expand RLE tuples to get absolute values
  const balances: number[] = [];

  for (const entry of data.balances) {
    if (isRLEEntry(entry)) {
      // Expand RLE sequence [value, count]
      const [value, count] = entry;
      for (let i = 0; i < count; i++) {
        balances.push(value);
      }
    } else {
      // Regular absolute value (backward compatibility: also handles uncompressed format)
      balances.push(entry);
    }
  }

  return {
    latestDate: data.latestDate,
    balances,
  };
}

/**
 * Compress a full BalanceHistoryCache
 *
 * @param cache - The cache to compress
 * @returns Compressed cache
 * @example
 * compressBalanceHistoryCache({
 *   HOUR: { latestDate: 1000, balances: [100, 100, 100] },
 *   DAY: { latestDate: 2000, balances: [200, 200] },
 *   WEEK: { latestDate: 3000, balances: [300] }
 * })
 * // Returns: {
 * //   HOUR: { latestDate: 1000, balances: [[100, 3]] },
 * //   DAY: { latestDate: 2000, balances: [[200, 2]] },
 * //   WEEK: { latestDate: 3000, balances: [300] }
 * // }
 */
const EMPTY_COMPRESSED_DATA_CACHE: CompressedBalanceHistoryDataCache = {
  latestDate: undefined,
  balances: [],
};

export function compressBalanceHistoryCache(
  cache: BalanceHistoryCache | null | undefined,
): CompressedBalanceHistoryCache {
  return {
    HOUR: cache?.HOUR ? compressBalanceHistoryDataCache(cache.HOUR) : EMPTY_COMPRESSED_DATA_CACHE,
    DAY: cache?.DAY ? compressBalanceHistoryDataCache(cache.DAY) : EMPTY_COMPRESSED_DATA_CACHE,
    WEEK: cache?.WEEK ? compressBalanceHistoryDataCache(cache.WEEK) : EMPTY_COMPRESSED_DATA_CACHE,
  };
}

/**
 * Decompress a CompressedBalanceHistoryCache back to BalanceHistoryCache
 *
 * @param data - The compressed cache (or uncompressed for backward compatibility)
 * @returns Decompressed cache
 * @example
 * decompressBalanceHistoryCache({
 *   HOUR: { latestDate: 1000, balances: [[100, 3]] },
 *   DAY: { latestDate: 2000, balances: [200, 200] },
 *   WEEK: { latestDate: 3000, balances: [300] }
 * })
 * // Returns: {
 * //   HOUR: { latestDate: 1000, balances: [100, 100, 100] },
 * //   DAY: { latestDate: 2000, balances: [200, 200] },
 * //   WEEK: { latestDate: 3000, balances: [300] }
 * // }
 */
export function decompressBalanceHistoryCache(
  data: CompressedBalanceHistoryCache | BalanceHistoryCache | null | undefined,
): BalanceHistoryCache {
  if (data == null || typeof data !== "object") {
    return {
      HOUR: { latestDate: undefined, balances: [] },
      DAY: { latestDate: undefined, balances: [] },
      WEEK: { latestDate: undefined, balances: [] },
    };
  }
  return {
    HOUR: decompressBalanceHistoryDataCache(data.HOUR),
    DAY: decompressBalanceHistoryDataCache(data.DAY),
    WEEK: decompressBalanceHistoryDataCache(data.WEEK),
  };
}
