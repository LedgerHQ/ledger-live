import isEqual from "lodash/isEqual";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { ThunkDispatch } from "@reduxjs/toolkit";
import { calApi } from "@shared/api-services";
import { cryptoAssetsApi } from "./api";
import { PERSISTENCE_VERSION, SYNC_HASH_QUERY_KEY } from "./internals";
import {
  buildRestoreCacheEntries,
  groupTokensByCurrency,
  resolveCurrenciesToEvict,
} from "./internals/restore";
import { PersistedCALSchema } from "./schema";
import type {
  PersistedCAL,
  PersistedTokenEntry,
  TokenByAddressInCurrencyParams,
  TokenByTokenIdentifierInCurrencyParams,
} from "./types";

/**
 * Validates an untrusted persisted blob (e.g. read from localStorage) against
 * {@link PersistedCALSchema}. Returns `null` when the blob is missing, corrupt, or from an
 * older format version.
 */
export function parsePersistedCAL(raw: unknown): PersistedCAL | null {
  const result = PersistedCALSchema.safeParse(raw);
  return result.success ? result.data : null;
}

/**
 * Redux state that includes the CAL slice.
 *
 * Typed on {@link calApi} — the api the app actually registers — not on the injected
 * {@link cryptoAssetsApi}. The two are the same object at runtime, but this use case adds cache tags
 * via `enhanceEndpoints`, which widens the injected reducer's state type with those tags. Typing on
 * the registered api keeps this assignable from an app's `State`.
 */
export interface WithCryptoAssetsApi {
  [calApi.reducerPath]: ReturnType<typeof calApi.reducer>;
}

const PERSISTED_TOKEN_ENDPOINTS = new Set([
  "findTokenById",
  "findTokenByAddressInCurrency",
  "findTokenByTokenIdentifierInCurrency",
]);

/**
 * Extracts all cached tokens from RTK Query state. Only fulfilled token queries are considered,
 * deduplicated by token id. A token reached through several queries keeps its latest fetched body
 * but collects each query's lookup arguments, so restoring it rebuilds all those cache keys.
 */
export function extractTokensFromState(state: WithCryptoAssetsApi): PersistedTokenEntry[] {
  const rtkState = state[cryptoAssetsApi.reducerPath];

  if (!rtkState?.queries) {
    return [];
  }

  const tokensById = new Map<string, PersistedTokenEntry>();

  for (const query of Object.values(rtkState.queries)) {
    if (
      query?.status === "fulfilled" &&
      query.data &&
      PERSISTED_TOKEN_ENDPOINTS.has(query.endpointName)
    ) {
      const token = query.data as TokenCurrency;
      if (!token?.id) continue;

      const tokenIdentifier =
        query.endpointName === "findTokenByAddressInCurrency"
          ? (query.originalArgs as TokenByAddressInCurrencyParams | undefined)?.token_identifier
          : undefined;
      const tokenIdentifierLookup =
        query.endpointName === "findTokenByTokenIdentifierInCurrency"
          ? (query.originalArgs as TokenByTokenIdentifierInCurrencyParams | undefined)
              ?.token_identifier
          : undefined;

      tokensById.set(
        token.id,
        mergeTokenEntries(tokensById.get(token.id), {
          data: token,
          timestamp: query.fulfilledTimeStamp || Date.now(),
          token_identifier: tokenIdentifier,
          token_identifier_lookup: tokenIdentifierLookup,
        }),
      );
    }
  }

  return [...tokensById.values()];
}

/** Merges two entries of the same token: the later fetched body wins, lookup arguments add up. */
function mergeTokenEntries(
  previous: PersistedTokenEntry | undefined,
  next: PersistedTokenEntry,
): PersistedTokenEntry {
  if (!previous) return next;
  const latest = next.timestamp > previous.timestamp ? next : previous;
  return {
    data: latest.data,
    timestamp: latest.timestamp,
    token_identifier: previous.token_identifier ?? next.token_identifier,
    token_identifier_lookup: previous.token_identifier_lookup ?? next.token_identifier_lookup,
  };
}

/** Extracts the `currencyId → hash` map from fulfilled `getTokensSyncHash` queries. */
export function extractHashesFromState(state: WithCryptoAssetsApi): Record<string, string> {
  const rtkState = state[cryptoAssetsApi.reducerPath];

  if (!rtkState?.queries) {
    return {};
  }

  const hashes: Record<string, string> = {};

  for (const [queryKey, query] of Object.entries(rtkState.queries)) {
    if (
      query?.status === "fulfilled" &&
      query.endpointName === "getTokensSyncHash" &&
      query.data &&
      typeof query.data === "string"
    ) {
      // Query key format: 'getTokensSyncHash("ethereum")'
      const match = SYNC_HASH_QUERY_KEY.exec(queryKey);
      if (match?.[1]) {
        hashes[match[1]] = query.data;
      }
    }
  }

  return hashes;
}

/** Extracts a complete {@link PersistedCAL} (tokens + hashes) from RTK Query state. */
export function extractPersistedCALFromState(state: WithCryptoAssetsApi): PersistedCAL {
  const tokens = extractTokensFromState(state);
  const hashes = extractHashesFromState(state);

  return {
    version: PERSISTENCE_VERSION,
    tokens,
    ...(Object.keys(hashes).length > 0 && { hashes }),
  };
}

/**
 * Compares two {@link PersistedCAL} values by content (version, hashes, token data and lookup
 * arguments), ignoring token timestamps so refetches with identical cache content are considered
 * equal. Returns true only when both are null or both are content-equal.
 */
export function persistedCALContentEqual(a: PersistedCAL | null, b: PersistedCAL | null): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a.version !== b.version) return false;
  if (!isEqual(a.hashes, b.hashes)) return false;
  if (a.tokens.length !== b.tokens.length) return false;
  const tokensByIdA = new Map(a.tokens.map(t => [t.data.id, t]));
  const tokensByIdB = new Map(b.tokens.map(t => [t.data.id, t]));
  for (const [id, entryA] of tokensByIdA) {
    const entryB = tokensByIdB.get(id);
    if (!entryB || !tokenEntryContentEqual(entryA, entryB)) return false;
  }
  return true;
}

// A lookup argument gained after the token was first persisted must count as a change, or the blob
// is never rewritten and that cache key is never restored.
function tokenEntryContentEqual(a: PersistedTokenEntry, b: PersistedTokenEntry): boolean {
  return (
    isEqual(a.data, b.data) &&
    a.token_identifier === b.token_identifier &&
    a.token_identifier_lookup === b.token_identifier_lookup
  );
}

/** Filters out persisted tokens older than `ttl` (ms). */
export function filterExpiredTokens(
  tokens: PersistedTokenEntry[],
  ttl: number,
): PersistedTokenEntry[] {
  const now = Date.now();
  return tokens.filter(token => now - token.timestamp < ttl);
}

/**
 * Restores persisted tokens into the RTK Query cache. For a currency with a stored hash, validates
 * it against the current server hash and skips restoring that currency when the hash changed or the
 * hash fetch failed. Currencies with no stored hash are restored unconditionally (backward-compatible
 * with pre-hash persisted blobs).
 */
export async function restoreTokensToCache(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: ThunkDispatch<any, any, any>,
  persistedData: PersistedCAL,
  ttl: number,
): Promise<void> {
  const validTokens = filterExpiredTokens(persistedData.tokens, ttl);
  if (validTokens.length === 0) {
    return;
  }

  const tokensByCurrency = groupTokensByCurrency(validTokens);
  const currencyIdsToEvict = await resolveCurrenciesToEvict(
    dispatch,
    tokensByCurrency,
    persistedData.hashes ?? {},
  );

  const tokensToRestore = validTokens.filter(
    entry => !currencyIdsToEvict.has(entry.data.parentCurrencyId),
  );
  if (tokensToRestore.length === 0) {
    return;
  }

  const entries = buildRestoreCacheEntries(tokensToRestore);
  if (entries.length > 0) {
    dispatch(cryptoAssetsApi.util.upsertQueryEntries(entries));
  }
}
