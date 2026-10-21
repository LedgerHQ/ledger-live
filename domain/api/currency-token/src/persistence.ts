import isEqual from "lodash/isEqual";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { calApi } from "@shared/api-services";
import { cryptoAssetsApi } from "./api";
import { isCurrencyNotFoundError, PERSISTENCE_VERSION, SYNC_HASH_QUERY_KEY } from "./internals";
import {
  buildHashCacheEntries,
  buildRestoreCacheEntries,
  groupTokensByCurrency,
} from "./internals/restore";
import { PersistedCALSchema } from "./schema";
import type {
  CryptoAssetsDispatch,
  PersistedCAL,
  PersistedTokenEntry,
  TokenByAddressInCurrencyParams,
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

/**
 * Extracts all cached tokens from RTK Query state. Only fulfilled `findTokenById` and
 * `findTokenByAddressInCurrency` queries are considered, deduplicated by token id.
 */
export function extractTokensFromState(state: WithCryptoAssetsApi): PersistedTokenEntry[] {
  const rtkState = state[cryptoAssetsApi.reducerPath];

  if (!rtkState?.queries) {
    return [];
  }

  const tokens: PersistedTokenEntry[] = [];
  const seenIds = new Set<string>();

  for (const query of Object.values(rtkState.queries)) {
    if (
      query?.status === "fulfilled" &&
      query.data &&
      (query.endpointName === "findTokenById" ||
        query.endpointName === "findTokenByAddressInCurrency")
    ) {
      const token = query.data as TokenCurrency;
      if (!token?.id) continue;

      const tokenIdentifier =
        query.endpointName === "findTokenByAddressInCurrency"
          ? (query.originalArgs as TokenByAddressInCurrencyParams | undefined)?.token_identifier
          : undefined;

      if (seenIds.has(token.id)) continue;
      seenIds.add(token.id);

      tokens.push({
        data: token,
        timestamp: query.fulfilledTimeStamp || Date.now(),
        token_identifier: tokenIdentifier,
      });
    }
  }

  return tokens;
}

/**
 * Extracts the `currencyId → hash` map from `getTokensSyncHash` cache entries that still hold a hash.
 * A refetch can be pending or rejected while the previous hash is still the baseline worth saving,
 * unless CAL no longer lists the currency.
 */
export function extractHashesFromState(state: WithCryptoAssetsApi): Record<string, string> {
  const rtkState = state[cryptoAssetsApi.reducerPath];

  if (!rtkState?.queries) {
    return {};
  }

  const hashes: Record<string, string> = {};

  for (const [queryKey, query] of Object.entries(rtkState.queries)) {
    if (query?.endpointName !== "getTokensSyncHash" || typeof query.data !== "string") {
      continue;
    }
    // Query key format: 'getTokensSyncHash("ethereum")'
    const currencyId = SYNC_HASH_QUERY_KEY.exec(queryKey)?.[1];
    if (currencyId && !isCurrencyNotFoundError(query.error, currencyId)) {
      hashes[currencyId] = query.data;
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
 * Compares two {@link PersistedCAL} values by content (version, hashes, token data), ignoring
 * token timestamps so refetches with identical cache content are considered equal. Returns true
 * only when both are null or both are content-equal.
 */
export function persistedCALContentEqual(a: PersistedCAL | null, b: PersistedCAL | null): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a.version !== b.version) return false;
  if (!isEqual(a.hashes, b.hashes)) return false;
  if (a.tokens.length !== b.tokens.length) return false;
  const tokensByIdA = new Map(a.tokens.map(t => [t.data.id, t.data]));
  const tokensByIdB = new Map(b.tokens.map(t => [t.data.id, t.data]));
  for (const [id, dataA] of tokensByIdA) {
    const dataB = tokensByIdB.get(id);
    if (!dataB || !isEqual(dataA, dataB)) return false;
  }
  return true;
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
 * Optimistically restores persisted tokens and their stored hashes into the RTK Query cache
 * without blocking loading, then starts a hash check for each restored currency. The check
 * evicts that currency's stale tokens itself (see `getTokensSyncHash`); a failed check keeps
 * both. Currencies with no stored hash are never evicted.
 */
export function restoreTokensToCache(
  dispatch: CryptoAssetsDispatch,
  persistedData: PersistedCAL,
  ttl: number,
): void {
  const validTokens = filterExpiredTokens(persistedData.tokens, ttl);
  if (validTokens.length === 0) {
    return;
  }

  const hashes = hashesForRestoredCurrencies(
    persistedData.hashes ?? {},
    groupTokensByCurrency(validTokens),
  );
  dispatch(
    cryptoAssetsApi.util.upsertQueryEntries([
      ...buildRestoreCacheEntries(validTokens),
      ...buildHashCacheEntries(hashes),
    ]),
  );

  // The entry stays pending with the stored hash as data, so a later lookup joins this check.
  // It stays subscribed, so the stored hash is not dropped as unused data before the next save.
  for (const currencyId of Object.keys(hashes)) {
    void dispatch(
      cryptoAssetsApi.endpoints.getTokensSyncHash.initiate(currencyId, { forceRefetch: true }),
    );
  }
}

function hashesForRestoredCurrencies(
  hashes: Record<string, string>,
  tokensByCurrency: Map<string, PersistedTokenEntry[]>,
): Record<string, string> {
  const restored: Record<string, string> = {};
  for (const currencyId of tokensByCurrency.keys()) {
    const hash = hashes[currencyId];
    if (hash) restored[currencyId] = hash;
  }
  return restored;
}
