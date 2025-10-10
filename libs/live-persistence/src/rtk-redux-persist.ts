import { log } from "@ledgerhq/logs";
import type { Api } from "@reduxjs/toolkit/query";
import type { Dispatch } from "@reduxjs/toolkit";

/**
 * Represents a cached query that should be persisted
 */
export interface CachedQuery {
  status: "fulfilled";
  data: unknown;
  endpointName: string;
  fulfilledTimeStamp: number;
}

/**
 * The persisted state structure for RTK Query
 */
export interface PersistedRtkQueryState {
  queries: Record<string, CachedQuery>;
  provided?: Record<string, unknown>;
}

/**
 * Parsed cache key structure
 */
export interface ParsedCacheKey {
  endpointName: string;
  originalArgs: unknown;
}

/**
 * Creates a selector that extracts cacheable RTK Query state
 * Only extracts fulfilled queries that are not stale according to TTL
 *
 * @param api - The RTK Query API instance
 * @param ttl - Optional TTL in milliseconds (defaults to api's keepUnusedDataFor)
 * @param endpointFilter - Optional array of endpoint names to cache. If not provided, all endpoints are cached.
 * @returns A selector function that takes the full Redux state
 */
export function createRtkQueryStateSelector<A extends Api<any, any, any, any>>(
  api: A,
  ttl?: number,
  endpointFilter?: string[],
): (state: any) => PersistedRtkQueryState | null {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const effectiveTtl = ttl ?? (api as any).config?.keepUnusedDataFor * 1000;

  return (state: any) => {
    const apiState = state[api.reducerPath];
    if (!apiState) {
      return null;
    }

    const now = Date.now();
    const queries: Record<string, CachedQuery> = {};

    // Extract only fulfilled queries within TTL
    for (const [key, query] of Object.entries<any>(apiState.queries || {})) {
      // Skip if endpoint filter is provided and this endpoint is not in the list
      if (endpointFilter && !endpointFilter.includes(query.endpointName)) {
        continue;
      }

      if (
        query.status === "fulfilled" &&
        query.fulfilledTimeStamp &&
        now - query.fulfilledTimeStamp < effectiveTtl
      ) {
        queries[key] = {
          status: query.status,
          data: query.data,
          endpointName: query.endpointName,
          fulfilledTimeStamp: query.fulfilledTimeStamp,
        };
      }
    }

    return {
      queries,
      provided: apiState.provided || {},
    };
  };
}

/**
 * Parses an RTK Query serialized cache key back into its components
 *
 * RTK Query uses default serializeQueryArgs which creates keys like:
 * - 'endpointName(undefined)' for queries with no args
 * - 'endpointName({"id":"value"})' for queries with args
 *
 * @param cacheKey - The serialized cache key from RTK Query
 * @returns The parsed endpoint name and original arguments
 */
export function parseSerializedCacheKey(cacheKey: string): ParsedCacheKey {
  try {
    // RTK Query cache keys follow the pattern: endpointName(args)
    // where args is a JSON-stringified object or "undefined"
    const match = cacheKey.match(/^(\w+)\((.*)\)$/);

    if (!match) {
      throw new Error(`Invalid cache key format: ${cacheKey}`);
    }

    const endpointName = match[1];
    const argsStr = match[2];

    let originalArgs: unknown;
    if (argsStr === "undefined") {
      originalArgs = undefined;
    } else {
      try {
        originalArgs = JSON.parse(argsStr);
      } catch {
        // If JSON parsing fails, treat it as a string literal
        originalArgs = argsStr.replace(/^"(.*)"$/, "$1");
      }
    }

    return {
      endpointName,
      originalArgs,
    };
  } catch (error) {
    log("persistence", `Failed to parse cache key: ${cacheKey}`, error);
    throw error;
  }
}

/**
 * Filters out queries that are older than the specified TTL
 *
 * @param queries - Record of cached queries
 * @param ttl - Time to live in milliseconds
 * @returns Filtered queries
 */
export function filterStaleQueries(
  queries: Record<string, CachedQuery>,
  ttl: number,
): Record<string, CachedQuery> {
  const now = Date.now();
  const filtered: Record<string, CachedQuery> = {};

  for (const [key, query] of Object.entries(queries)) {
    if (now - query.fulfilledTimeStamp < ttl) {
      filtered[key] = query;
    }
  }

  return filtered;
}

/**
 * Checks if two persisted states differ significantly
 *
 * @param oldState - Previous persisted state
 * @param newState - New persisted state
 * @returns true if states differ significantly
 */
export function shouldPersist(
  oldState: PersistedRtkQueryState | null,
  newState: PersistedRtkQueryState | null,
): boolean {
  if (oldState === newState) return false;
  if (!newState) return false; // Don't persist null state
  if (!oldState) return true; // Persist if we have new state and no old state

  // Check if query keys differ
  const oldKeys = Object.keys(oldState.queries).sort();
  const newKeys = Object.keys(newState.queries).sort();

  if (oldKeys.length !== newKeys.length) return true;
  if (oldKeys.some((key, i) => key !== newKeys[i])) return true;

  // Check if any query data changed
  for (const key of newKeys) {
    const oldQuery = oldState.queries[key];
    const newQuery = newState.queries[key];

    if (!oldQuery || !newQuery) return true;
    if (oldQuery.fulfilledTimeStamp !== newQuery.fulfilledTimeStamp) return true;
    // Deep comparison of data could be expensive, we rely on timestamp for now
  }

  return false;
}

/**
 * Auto-detect token data from query results for cross-caching
 * Returns null if data doesn't look like a token
 */
function extractTokenDataAuto(
  data: unknown,
): { id: string; contractAddress: string; parentCurrencyId: string } | null {
  if (!data || typeof data !== "object") return null;

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const obj = data as Record<string, unknown>;

  // Check if it looks like a token with all required fields
  if (
    typeof obj.id === "string" &&
    typeof obj.contractAddress === "string" &&
    obj.parentCurrency &&
    typeof obj.parentCurrency === "object" &&
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    typeof (obj.parentCurrency as Record<string, unknown>).id === "string"
  ) {
    return {
      id: obj.id,
      contractAddress: obj.contractAddress,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      parentCurrencyId: (obj.parentCurrency as Record<string, unknown>).id as string,
    };
  }

  return null;
}

/**
 * Hydrates RTK Query cache from persisted state with automatic cross-caching
 *
 * @param api - The RTK Query API instance
 * @param dispatch - Redux dispatch function (must support thunks)
 * @param persistedState - The persisted cache state to hydrate from
 * @param enableCrossCaching - Whether to enable automatic cross-caching for tokens (default: true)
 */
export function hydrateRtkQueryCache<A extends Api<any, any, any, any>>(
  api: A,
  dispatch: any, // Using any to allow thunk dispatch
  persistedState: PersistedRtkQueryState | null,
  enableCrossCaching = true,
): void {
  if (!persistedState?.queries) {
    return;
  }

  const queriesCount = Object.keys(persistedState.queries).length;
  log("persistence", `Hydrating ${api.reducerPath} cache with ${queriesCount} queries`);

  for (const [cacheKey, cachedQuery] of Object.entries(persistedState.queries)) {
    try {
      const { endpointName, originalArgs } = parseSerializedCacheKey(cacheKey);

      // Restore the original cache entry
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      dispatch(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        api.util.upsertQueryData(endpointName as any, originalArgs, cachedQuery.data),
      );

      // Cross-cache optimization: automatically detect tokens and cache under both access patterns
      if (enableCrossCaching && cachedQuery.data) {
        const tokenData = extractTokenDataAuto(cachedQuery.data);

        if (tokenData) {
          if (endpointName === "findTokenByAddressInCurrency") {
            // Also cache under findTokenById
            dispatch(
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              api.util.upsertQueryData(
                "findTokenById" as any,
                { id: tokenData.id },
                cachedQuery.data,
              ),
            );
          } else if (endpointName === "findTokenById") {
            // Also cache under findTokenByAddressInCurrency
            dispatch(
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              api.util.upsertQueryData(
                "findTokenByAddressInCurrency" as any,
                {
                  contract_address: tokenData.contractAddress,
                  network: tokenData.parentCurrencyId,
                },
                cachedQuery.data,
              ),
            );
          }
        }
      }
    } catch (error) {
      log("persistence", `Failed to hydrate cache entry: ${cacheKey}`, error);
    }
  }
}
