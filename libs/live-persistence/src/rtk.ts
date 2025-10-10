import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { CacheAdapter } from "./types";

export type HttpCacheResult = {
  data: unknown | undefined; // Raw HTTP response data or undefined if not found
};

export interface PersistentBaseQueryConfig {
  baseUrl: string;
  cacheAdapter: CacheAdapter<HttpCacheResult>;
  clientVersion: string; // Version of the client using the API to set in header
  validateAndTransformResponse: (data: unknown) => unknown;
}

export function createPersistentBaseQuery(config: PersistentBaseQueryConfig) {
  const { baseUrl, cacheAdapter, clientVersion, validateAndTransformResponse } = config;

  const baseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: headers => {
      headers.set("Content-Type", "application/json");
      headers.set("X-Ledger-Client-Version", clientVersion);
      return headers;
    },
  });

  return async (args: any, api: any, extraOptions: any) => {
    // Generate cache key from the query
    const cacheKey = `${args.url}?${new URLSearchParams(args.params).toString()}`;

    // 1. Check persistent cache first
    let cached;
    try {
      cached = await cacheAdapter.get(cacheKey);
    } catch (error) {
      console.error("Cache get error:", error);
      cached = null;
    }
    const now = Date.now();

    if (cached !== null && cached.expiresAt > now && cached.version === cacheAdapter.version) {
      // Cache is valid, check if we need to refresh
      if (cached.refreshAt <= now) {
        // Cache is stale, make fresh request and return it
        const result = await baseQuery(args, api, extraOptions);
        const transformedData = validateAndTransformResponse(result.data);

        // Update cache with fresh data
        const cacheResult: HttpCacheResult = { data: result.data };
        try {
          await cacheAdapter.set(cacheKey, cacheResult);
        } catch (error) {
          console.error("Cache set error (background refresh):", error);
        }

        return { data: transformedData };
      } else {
        // Cache is fresh, return cached data
        const transformedData =
          cached.data.data !== undefined
            ? validateAndTransformResponse(cached.data.data)
            : undefined;
        return { data: transformedData };
      }
    }

    // 2. No valid cache, make HTTP request
    const result = await baseQuery(args, api, extraOptions);
    const transformedData = validateAndTransformResponse(result.data);

    // 3. Save to persistent cache only if validation succeeded
    const cacheResult: HttpCacheResult = { data: result.data };
    try {
      await cacheAdapter.set(cacheKey, cacheResult);
    } catch (error) {
      console.error("Cache set error:", error);
    }

    return { data: transformedData };
  };
}
