import isEqual from "lodash/isEqual";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { calApi, type CalApiExtra } from "@shared/api-services";
import { cryptoAssetsApi } from "./api";
import {
  PERSISTENCE_VERSION,
  SYNC_HASH_QUERY_KEY,
  tokenCurrencyTag,
  tokenListTag,
} from "./internals";
import {
  buildRestoreCacheEntries,
  groupTokensByCurrency,
  resolveCurrenciesToEvict,
} from "./internals/restore";
import {
  baselineSeeded,
  selectSyncHashBaseline,
  selectSyncHashChangedAt,
  type SyncHashBaselineState,
} from "./internals/syncHashBaseline";
import { PersistedCALSchema } from "./schema";
import type { PersistedCAL, PersistedTokenEntry, TokenByAddressInCurrencyParams } from "./types";

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
  /** Present only when the app registers `syncHashBaselineReducer`. */
  calSyncHashBaseline?: SyncHashBaselineState;
}

export type CalTokenCacheDispatch = ThunkDispatch<WithCryptoAssetsApi, CalApiExtra, UnknownAction>;

const TOKEN_LOOKUP_ENDPOINTS = new Set<string>(["findTokenById", "findTokenByAddressInCurrency"]);

type TokenLookupQuery = {
  status?: string;
  data?: unknown;
  endpointName?: string;
  fulfilledTimeStamp?: number;
  originalArgs?: unknown;
};

type ObservedSyncHash = { hash: string; at: number };

function isFulfilledTokenLookup(
  query: TokenLookupQuery | undefined,
): query is TokenLookupQuery & { data: TokenCurrency; endpointName: string } {
  return (
    query?.status === "fulfilled" &&
    !!query.data &&
    typeof query.endpointName === "string" &&
    TOKEN_LOOKUP_ENDPOINTS.has(query.endpointName)
  );
}

function isStaleRelativeToHashCutoff(
  token: TokenCurrency,
  timestamp: number,
  baseline: Record<string, string>,
  changedAt: Record<string, number>,
  observedHashes: Record<string, ObservedSyncHash>,
): boolean {
  const baselineHash = baseline[token.parentCurrencyId];
  const observed = observedHashes[token.parentCurrencyId];
  if (!baselineHash || !observed || observed.hash === baselineHash) {
    return false;
  }

  const cutoff = changedAt[token.parentCurrencyId] ?? observed.at;
  return timestamp <= cutoff;
}

function tokenIdentifierFromAddressLookup(query: TokenLookupQuery): string | undefined {
  if (query.endpointName !== "findTokenByAddressInCurrency") {
    return undefined;
  }
  return (query.originalArgs as TokenByAddressInCurrencyParams | undefined)?.token_identifier;
}

/**
 * Extracts all cached tokens from RTK Query state. Only fulfilled `findTokenById` and
 * `findTokenByAddressInCurrency` queries are considered, deduplicated by token id. A token fetched
 * before a hash check saw a different hash than its restore baseline is stale and is left out.
 */
export function extractTokensFromState(state: WithCryptoAssetsApi): PersistedTokenEntry[] {
  const rtkState = state[cryptoAssetsApi.reducerPath];

  if (!rtkState?.queries) {
    return [];
  }

  const baseline = selectSyncHashBaseline(state);
  const changedAt = selectSyncHashChangedAt(state);
  const observedHashes = extractObservedHashes(state);

  const tokens: PersistedTokenEntry[] = [];
  const seenIds = new Set<string>();

  for (const query of Object.values(rtkState.queries)) {
    if (!isFulfilledTokenLookup(query)) continue;

    const token = query.data;
    if (!token.id) continue;

    const timestamp = query.fulfilledTimeStamp || Date.now();
    if (isStaleRelativeToHashCutoff(token, timestamp, baseline, changedAt, observedHashes)) {
      continue;
    }

    if (seenIds.has(token.id)) continue;
    seenIds.add(token.id);

    tokens.push({
      data: token,
      timestamp,
      token_identifier: tokenIdentifierFromAddressLookup(query),
    });
  }

  return tokens;
}

/** Reads each fulfilled `getTokensSyncHash` query as `currencyId → { hash, at }`. */
function extractObservedHashes(state: WithCryptoAssetsApi): Record<string, ObservedSyncHash> {
  const rtkState = state[cryptoAssetsApi.reducerPath];
  const observed: Record<string, { hash: string; at: number }> = {};

  for (const [queryKey, query] of Object.entries(rtkState?.queries ?? {})) {
    if (
      query?.status === "fulfilled" &&
      query.endpointName === "getTokensSyncHash" &&
      query.data &&
      typeof query.data === "string"
    ) {
      // Query key format: 'getTokensSyncHash("ethereum")'
      const match = SYNC_HASH_QUERY_KEY.exec(queryKey);
      if (match?.[1]) {
        observed[match[1]] = { hash: query.data, at: query.fulfilledTimeStamp ?? 0 };
      }
    }
  }

  return observed;
}

/**
 * Extracts the `currencyId → hash` map. A fulfilled `getTokensSyncHash` query wins; a currency
 * whose check is pending or failed keeps its restore baseline hash.
 */
export function extractHashesFromState(state: WithCryptoAssetsApi): Record<string, string> {
  const hashes: Record<string, string> = { ...selectSyncHashBaseline(state) };

  for (const [currencyId, { hash }] of Object.entries(extractObservedHashes(state))) {
    hashes[currencyId] = hash;
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
 * Restores persisted tokens into the RTK Query cache without waiting for the network. Then, in the
 * background, checks the stored hash of each currency against the current server hash. When a hash
 * changed, the token cache is invalidated. A failed or slow hash check keeps the restored tokens.
 * Currencies with no stored hash are never checked (backward-compatible with pre-hash blobs).
 */
export function restoreTokensToCache(
  dispatch: CalTokenCacheDispatch,
  persistedData: PersistedCAL,
  ttl: number,
): void {
  const validTokens = filterExpiredTokens(persistedData.tokens, ttl);
  if (validTokens.length === 0) {
    return;
  }

  const entries = buildRestoreCacheEntries(validTokens);
  if (entries.length > 0) {
    dispatch(cryptoAssetsApi.util.upsertQueryEntries(entries));
  }

  const tokensByCurrency = groupTokensByCurrency(validTokens);
  const baseline = Object.fromEntries(
    Object.entries(persistedData.hashes ?? {}).filter(([currencyId]) =>
      tokensByCurrency.has(currencyId),
    ),
  );
  if (Object.keys(baseline).length > 0) {
    dispatch(baselineSeeded(baseline));
  }

  void evictChangedCurrencies(dispatch, tokensByCurrency, baseline);
}

async function evictChangedCurrencies(
  dispatch: CalTokenCacheDispatch,
  tokensByCurrency: ReturnType<typeof groupTokensByCurrency>,
  hashes: Record<string, string>,
): Promise<void> {
  try {
    const currencyIdsToEvict = await resolveCurrenciesToEvict(dispatch, tokensByCurrency, hashes);
    if (currencyIdsToEvict.size > 0) {
      dispatch(
        cryptoAssetsApi.util.invalidateTags([
          ...[...currencyIdsToEvict].map(currencyId => tokenCurrencyTag(currencyId)),
          tokenListTag(),
        ]),
      );
    }
  } catch {
    // Hash check failed: keep the restored tokens.
  }
}
