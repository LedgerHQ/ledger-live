import isEqual from "lodash/isEqual";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { ThunkDispatch } from "@reduxjs/toolkit";
import { calApi } from "@shared/api-services";
import { cryptoAssetsApi } from "./api";
import { PERSISTENCE_VERSION, SYNC_HASH_QUERY_KEY, UNCHECKED_TOKEN_TTL } from "./internals";
import { buildRestoreCacheEntries, buildSyncHashCacheEntries } from "./internals/restore";
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
 * Extracts the `currencyId → hash` map from the `getTokensSyncHash` queries that hold a hash. A
 * refetch that is pending or failed keeps its last hash, so a stored hash survives a hash check that
 * has not succeeded yet.
 */
export function extractHashesFromState(state: WithCryptoAssetsApi): Record<string, string> {
  const rtkState = state[cryptoAssetsApi.reducerPath];

  if (!rtkState?.queries) {
    return {};
  }

  const hashes: Record<string, string> = {};

  for (const [queryKey, query] of Object.entries(rtkState.queries)) {
    if (
      query?.endpointName === "getTokensSyncHash" &&
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

/**
 * Restores persisted tokens into the RTK Query cache without waiting for the network, so the app
 * loads with them even when CAL does not answer.
 *
 * A currency with a stored hash gets its tokens back whatever their age, with that hash, and its
 * hash is checked again in the background. When the hash changed, `getTokensSyncHash` evicts the
 * token cache; when the check fails, the tokens and the stored hash stay. Tokens of a currency with
 * no stored hash cannot be checked, so they are restored only within {@link UNCHECKED_TOKEN_TTL}.
 */
export function restoreTokensToCache(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: ThunkDispatch<any, any, any>,
  persistedData: PersistedCAL,
): void {
  const storedHashes = persistedData.hashes ?? {};
  const now = Date.now();
  const tokens = persistedData.tokens.filter(
    ({ data, timestamp }) =>
      storedHashes[data.parentCurrencyId] !== undefined || now - timestamp < UNCHECKED_TOKEN_TTL,
  );
  if (tokens.length === 0) {
    return;
  }

  const hashes: Record<string, string> = {};
  for (const { data } of tokens) {
    const hash = storedHashes[data.parentCurrencyId];
    if (hash !== undefined) hashes[data.parentCurrencyId] = hash;
  }

  dispatch(
    cryptoAssetsApi.util.upsertQueryEntries([
      ...buildRestoreCacheEntries(tokens),
      ...buildSyncHashCacheEntries(hashes),
    ]),
  );

  for (const currencyId of Object.keys(hashes)) {
    dispatch(
      cryptoAssetsApi.endpoints.getTokensSyncHash.initiate(currencyId, { forceRefetch: true }),
    );
  }
}
