import type { TokenCurrency } from "@domain/entity-currency-token";
import type { QueryCacheKey } from "@reduxjs/toolkit/query";
import type { TokenByAddressInCurrencyParams } from "../types";

/** The fields of an RTK Query cache entry that eviction reads. */
export type TokenQueryEntry = {
  endpointName?: string;
  status?: string;
  data?: unknown;
  originalArgs?: unknown;
  fulfilledTimeStamp?: number;
};

const TOKEN_ENDPOINTS = new Set(["findTokenById", "findTokenByAddressInCurrency"]);

/**
 * Cache keys of the token lookups that a changed `currencyId` hash makes stale: the ones that
 * settled at or before `checkStartedAt`. A lookup that settled later came from the server
 * during the check, so it stays.
 */
export function staleTokenQueryKeys(
  queries: Record<string, TokenQueryEntry | undefined>,
  currencyId: string,
  checkStartedAt: number,
): QueryCacheKey[] {
  const keys: QueryCacheKey[] = [];
  for (const [queryCacheKey, entry] of Object.entries(queries)) {
    if (!entry?.endpointName || !TOKEN_ENDPOINTS.has(entry.endpointName)) continue;
    if (tokenQueryCurrencyId(entry) !== currencyId) continue;
    if (isStale(entry, checkStartedAt)) keys.push(queryCacheKey as QueryCacheKey);
  }
  return keys;
}

function isStale(entry: TokenQueryEntry, checkStartedAt: number): boolean {
  return entry.fulfilledTimeStamp !== undefined && entry.fulfilledTimeStamp <= checkStartedAt;
}

function tokenQueryCurrencyId(entry: TokenQueryEntry): string | undefined {
  const token = entry.data as TokenCurrency | undefined;
  if (token?.parentCurrencyId) return token.parentCurrencyId;
  if (entry.endpointName !== "findTokenByAddressInCurrency") return undefined;
  return (entry.originalArgs as TokenByAddressInCurrencyParams | undefined)?.network;
}
