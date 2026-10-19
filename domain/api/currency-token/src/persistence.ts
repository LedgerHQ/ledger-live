import isEqual from "lodash/isEqual";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { calApi } from "@shared/api-services";
import { cryptoAssetsApi } from "./api";
import { PERSISTENCE_VERSION, SYNC_HASH_QUERY_KEY } from "./internals";
import {
  buildRestoreCacheEntries,
  checkStoredHash,
  groupTokensByCurrency,
  hashQueryCacheKey,
  restoreQueryCacheKeys,
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
 * A refetch can be pending or rejected while the previous hash is still the baseline worth saving.
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
    const match = SYNC_HASH_QUERY_KEY.exec(queryKey);
    if (match?.[1]) {
      hashes[match[1]] = query.data;
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
 * Optimistically restores persisted tokens into the RTK Query cache without blocking loading,
 * and pins each stored hash onto that currency's in-flight check. Currencies are checked
 * independently: a changed hash drops that currency's restored entries, a currency CAL no
 * longer lists drops the hash too, and a failed check leaves both in place. Currencies with
 * no stored hash are never evicted.
 */
export async function restoreTokensToCache(
  dispatch: CryptoAssetsDispatch,
  persistedData: PersistedCAL,
  ttl: number,
): Promise<void> {
  const validTokens = filterExpiredTokens(persistedData.tokens, ttl);
  if (validTokens.length === 0) {
    return;
  }

  const entries = buildRestoreCacheEntries(validTokens);
  if (entries.length > 0) {
    dispatch(cryptoAssetsApi.util.upsertQueryEntries(entries));
  }

  const tokensByCurrency = groupTokensByCurrency(validTokens);
  const hashesToRestore = hashesForRestoredCurrencies(persistedData.hashes ?? {}, tokensByCurrency);
  for (const [currencyId, tokens] of tokensByCurrency) {
    const storedHash = hashesToRestore[currencyId];
    if (!storedHash) continue;
    void checkStoredHash(dispatch, currencyId, storedHash).then(verdict => {
      if (verdict.action === "keep") return;
      dropRestoredCacheEntries(dispatch, tokens);
      if (verdict.action === "missing") dropHashCacheEntry(dispatch, currencyId);
    });
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

function dropHashCacheEntry(dispatch: CryptoAssetsDispatch, currencyId: string) {
  dispatch(
    cryptoAssetsApi.internalActions.removeQueryResult({
      queryCacheKey: hashQueryCacheKey(currencyId),
    }),
  );
}

function dropRestoredCacheEntries(dispatch: CryptoAssetsDispatch, tokens: PersistedTokenEntry[]) {
  for (const queryCacheKey of restoreQueryCacheKeys(tokens)) {
    dispatch(cryptoAssetsApi.internalActions.removeQueryResult({ queryCacheKey }));
  }
}
