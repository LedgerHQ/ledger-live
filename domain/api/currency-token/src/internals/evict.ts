import type { TokenCurrency } from "@domain/entity-currency-token";
import type { QueryCacheKey } from "@reduxjs/toolkit/query";
import type { TokenByAddressInCurrencyParams, TokenByIdParams } from "../types";

/** The fields of an RTK Query cache entry that eviction reads. */
export type TokenQueryEntry = {
  endpointName?: string;
  status?: string;
  data?: unknown;
  originalArgs?: unknown;
  requestId?: string;
};

/** The request that filled each of a currency's settled token lookups when a hash check started. */
export type TokenRequestSnapshot = ReadonlyMap<QueryCacheKey, string>;

const TOKEN_ENDPOINTS = new Set(["findTokenById", "findTokenByAddressInCurrency"]);

/** Records the settled token lookups of `currencyId` that a changed hash would make stale. */
export function snapshotTokenRequests(
  queries: Record<string, TokenQueryEntry | undefined>,
  currencyId: string,
): TokenRequestSnapshot {
  const snapshot = new Map<QueryCacheKey, string>();
  for (const [queryCacheKey, entry] of Object.entries(queries)) {
    if (!entry?.endpointName || !TOKEN_ENDPOINTS.has(entry.endpointName)) continue;
    if (entry.status !== "fulfilled" || entry.requestId === undefined) continue;
    if (tokenQueryCurrencyId(entry) !== currencyId) continue;
    snapshot.set(queryCacheKey as QueryCacheKey, entry.requestId);
  }
  return snapshot;
}

/**
 * Cache keys from `snapshot` that still hold the same settled request. A lookup that started
 * after the snapshot has a new request id: it came from the server during the check, or it is
 * an in-flight refetch whose failure is never saved, so it stays.
 */
export function staleTokenQueryKeys(
  queries: Record<string, TokenQueryEntry | undefined>,
  snapshot: TokenRequestSnapshot,
): QueryCacheKey[] {
  const keys: QueryCacheKey[] = [];
  for (const [queryCacheKey, requestId] of snapshot) {
    const entry = queries[queryCacheKey];
    if (entry?.status === "fulfilled" && entry.requestId === requestId) keys.push(queryCacheKey);
  }
  return keys;
}

function tokenQueryCurrencyId(entry: TokenQueryEntry): string | undefined {
  const token = entry.data as TokenCurrency | undefined;
  if (token?.parentCurrencyId) return token.parentCurrencyId;
  // A cached miss has no data: read the currency from the lookup arguments.
  if (entry.endpointName === "findTokenById") {
    return (entry.originalArgs as TokenByIdParams | undefined)?.id.split("/")[0];
  }
  return (entry.originalArgs as TokenByAddressInCurrencyParams | undefined)?.network;
}
