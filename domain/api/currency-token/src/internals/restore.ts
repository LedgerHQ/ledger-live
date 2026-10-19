import type { TokenCurrency } from "@domain/entity-currency-token";
import type { QueryCacheKey } from "@reduxjs/toolkit/query";
import { cryptoAssetsApi } from "../api";
import type { CryptoAssetsDispatch, PersistedTokenEntry } from "../types";
import { isCurrencyNotFoundError } from "./errors";

// Package-private cache-restoration helpers for `restoreTokensToCache`. Imported directly by
// `persistence.ts` (not via the internals barrel) so `api.ts` → internals never forms a cycle.

/** Groups persisted token entries by their parent crypto-currency id. */
export function groupTokensByCurrency(
  tokens: PersistedTokenEntry[],
): Map<string, PersistedTokenEntry[]> {
  const byCurrency = new Map<string, PersistedTokenEntry[]>();
  for (const entry of tokens) {
    const currencyId = entry.data.parentCurrencyId;
    const group = byCurrency.get(currencyId);
    if (group) {
      group.push(entry);
    } else {
      byCurrency.set(currencyId, [entry]);
    }
  }
  return byCurrency;
}

export type StoredHashVerdict =
  | { action: "keep" }
  | { action: "changed"; hash: string }
  | { action: "missing" };

/**
 * Decides what a restored currency should do with one hash response.
 * A failed or incomplete response keeps both the tokens and the stored hash.
 */
export function decideHashCheck(
  currencyId: string,
  storedHash: string,
  result: { data?: unknown; error?: unknown },
): StoredHashVerdict {
  if (isCurrencyNotFoundError(result.error, currencyId)) return { action: "missing" };
  if (typeof result.data === "string" && result.data !== storedHash) {
    return { action: "changed", hash: result.data };
  }
  return { action: "keep" };
}

/**
 * Starts one currency's hash check and writes `storedHash` onto that in-flight entry.
 * The entry stays pending, so a later `getTokensSyncHash` joins the request instead of
 * treating the stored hash as a fresh server result. A thrown request keeps the baseline.
 */
export async function checkStoredHash(
  dispatch: CryptoAssetsDispatch,
  currencyId: string,
  storedHash: string,
): Promise<StoredHashVerdict> {
  try {
    const request = dispatch(
      cryptoAssetsApi.endpoints.getTokensSyncHash.initiate(currencyId, { forceRefetch: true }),
    );
    dispatch(
      cryptoAssetsApi.internalActions.queryResultPatched({
        queryCacheKey: hashQueryCacheKey(currencyId),
        patches: [{ op: "replace", path: [], value: storedHash }],
      }),
    );
    return decideHashCheck(currencyId, storedHash, await request);
  } catch {
    return { action: "keep" };
  }
}

type HashCacheEntry = { endpointName: "getTokensSyncHash"; arg: string; value: string };

function buildHashCacheEntries(hashes: Record<string, string>): HashCacheEntry[] {
  return Object.entries(hashes).map(([currencyId, hash]) => ({
    endpointName: "getTokensSyncHash",
    arg: currencyId,
    value: hash,
  }));
}

/** Cache key RTK Query assigns a `getTokensSyncHash` entry for this currency. */
export function hashQueryCacheKey(currencyId: string): QueryCacheKey {
  const [key] = queryCacheKeys(buildHashCacheEntries({ [currencyId]: currencyId }));
  if (key === undefined) {
    throw new Error("Could not resolve cache key for stored hash");
  }
  return key;
}

type RestoreCacheEntry =
  | { endpointName: "findTokenById"; arg: { id: string }; value: TokenCurrency | undefined }
  | {
      endpointName: "findTokenByAddressInCurrency";
      arg: { contract_address: string; network: string; token_identifier?: string };
      value: TokenCurrency | undefined;
    };

/**
 * Builds the RTK Query cache entries to upsert for the given persisted tokens: a `findTokenById`
 * and a `findTokenByAddressInCurrency` entry per token, plus an address-only key when a
 * `token_identifier` is present (so lookups without it still hit the cache).
 */
export function buildRestoreCacheEntries(tokens: PersistedTokenEntry[]): RestoreCacheEntry[] {
  return tokens.flatMap(({ data: token, token_identifier }) => {
    const entries: RestoreCacheEntry[] = [
      { endpointName: "findTokenById", arg: { id: token.id }, value: token },
      {
        endpointName: "findTokenByAddressInCurrency",
        arg: {
          contract_address: token.contractAddress,
          network: token.parentCurrencyId,
          ...(token_identifier === undefined ? {} : { token_identifier }),
        },
        value: token,
      },
    ];

    if (token_identifier !== undefined) {
      entries.push({
        endpointName: "findTokenByAddressInCurrency",
        arg: { contract_address: token.contractAddress, network: token.parentCurrencyId },
        value: token,
      });
    }

    return entries;
  });
}

/**
 * Cache keys RTK Query assigns these restore entries. Read from the upsert action it would
 * dispatch, which is the same serializer that inserted them.
 */
export function restoreQueryCacheKeys(tokens: PersistedTokenEntry[]): QueryCacheKey[] {
  return queryCacheKeys(buildRestoreCacheEntries(tokens));
}

function queryCacheKeys(entries: Array<RestoreCacheEntry | HashCacheEntry>): QueryCacheKey[] {
  if (entries.length === 0) return [];

  const keys = cryptoAssetsApi.util.upsertQueryEntries(entries).payload.flatMap(entry => {
    const key = preparedQueryCacheKey(entry);
    return key === undefined ? [] : [key];
  });

  if (keys.length !== entries.length) {
    throw new Error("Could not resolve cache keys for restored entries");
  }

  return keys;
}

function preparedQueryCacheKey(entry: unknown): QueryCacheKey | undefined {
  if (!isRecord(entry) || !isRecord(entry.queryDescription)) return undefined;
  return isQueryCacheKey(entry.queryDescription.queryCacheKey)
    ? entry.queryDescription.queryCacheKey
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isQueryCacheKey(key: unknown): key is QueryCacheKey {
  return typeof key === "string" && key.includes("(") && key.endsWith(")");
}
