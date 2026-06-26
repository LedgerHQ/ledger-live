import { z } from "zod";
import isEqual from "lodash/isEqual";
import { TokenCurrencySchema, type TokenCurrency } from "@domain/entity-currency-token";
import type { ThunkDispatch } from "@reduxjs/toolkit";
import { cryptoAssetsApi } from "./api";
import { PERSISTENCE_VERSION } from "./internals";
import type { TokenByAddressInCurrencyParams } from "./types";

/** Schema for a persisted token entry: a {@link TokenCurrency} plus cache-restoration metadata. */
export const PersistedTokenEntrySchema = z.object({
  /** Serializable token data (post-LIVE-32268 `TokenCurrency` is already serializable). */
  data: TokenCurrencySchema,
  /** When this token was fetched (Unix timestamp in ms). */
  timestamp: z.number(),
  /**
   * The `token_identifier` used in the `findTokenByAddressInCurrency` query, if any.
   * Needed to reconstruct the correct RTK Query cache key on hydration for chains where
   * `contract_address` alone is not unique (e.g. MultiversX, Algorand, Cardano).
   */
  token_identifier: z.string().optional(),
});

export type PersistedTokenEntry = z.infer<typeof PersistedTokenEntrySchema>;

/** Schema for the root persisted CAL blob, with a version pin and an optional hash map. */
export const PersistedCALSchema = z.object({
  /** The persistence version of the CAL blob. Used to determine compatibility with the current schema. */
  version: z.literal(PERSISTENCE_VERSION),
  /** The persisted token entries. */
  tokens: z.array(PersistedTokenEntrySchema),
  /** Mapping of currencyId to its `X-Ledger-Commit` hash. */
  hashes: z.record(z.string(), z.string()).optional(),
});

export type PersistedCAL = z.infer<typeof PersistedCALSchema>;

/**
 * Validates an untrusted persisted blob (e.g. read from localStorage) against
 * {@link PersistedCALSchema}. Returns `null` when the blob is missing, corrupt, or from an
 * older format version.
 */
export function parsePersistedCAL(raw: unknown): PersistedCAL | null {
  const result = PersistedCALSchema.safeParse(raw);
  return result.success ? result.data : null;
}

/** Redux state that includes the {@link cryptoAssetsApi} reducer. */
export interface WithCryptoAssetsApi {
  [cryptoAssetsApi.reducerPath]: ReturnType<typeof cryptoAssetsApi.reducer>;
}

/**
 * Extracts all cached tokens from RTK Query state. Only fulfilled `findTokenById` and
 * `findTokenByAddressInCurrency` queries are considered, deduplicated by token id.
 */
export function extractTokensFromState(state: WithCryptoAssetsApi): PersistedTokenEntry[] {
  const rtkState = state[cryptoAssetsApi.reducerPath];

  if (!rtkState || !rtkState.queries) {
    return [];
  }

  const tokens: PersistedTokenEntry[] = [];
  const seenIds = new Set<string>();

  for (const query of Object.values(rtkState.queries)) {
    if (
      query &&
      query.status === "fulfilled" &&
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

/** Extracts the `currencyId → hash` map from fulfilled `getTokensSyncHash` queries. */
export function extractHashesFromState(state: WithCryptoAssetsApi): Record<string, string> {
  const rtkState = state[cryptoAssetsApi.reducerPath];

  if (!rtkState || !rtkState.queries) {
    return {};
  }

  const hashes: Record<string, string> = {};

  for (const [queryKey, query] of Object.entries(rtkState.queries)) {
    if (
      query &&
      query.status === "fulfilled" &&
      query.endpointName === "getTokensSyncHash" &&
      query.data &&
      typeof query.data === "string"
    ) {
      // Query key format: 'getTokensSyncHash("ethereum")'
      const match = queryKey.match(/getTokensSyncHash\("([^"]+)"\)/);
      if (match && match[1]) {
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

  const tokensByCurrency = new Map<string, PersistedTokenEntry[]>();
  for (const entry of validTokens) {
    const currencyId = entry.data.parentCurrencyId;
    if (!tokensByCurrency.has(currencyId)) {
      tokensByCurrency.set(currencyId, []);
    }
    tokensByCurrency.get(currencyId)!.push(entry);
  }

  const currencyIdsToEvict = new Set<string>();
  const hashes = persistedData.hashes || {};

  for (const currencyId of tokensByCurrency.keys()) {
    const storedHash = hashes[currencyId];
    if (!storedHash) continue;

    try {
      const currentHashResult = await dispatch(
        cryptoAssetsApi.endpoints.getTokensSyncHash.initiate(currencyId, {
          forceRefetch: false,
        }),
      );
      const currentHash = currentHashResult.data;

      if (currentHash && currentHash !== storedHash) {
        currencyIdsToEvict.add(currencyId);
      }
    } catch {
      currencyIdsToEvict.add(currencyId);
    }
  }

  const tokensToRestore = validTokens.filter(
    entry => !currencyIdsToEvict.has(entry.data.parentCurrencyId),
  );

  if (tokensToRestore.length === 0) {
    return;
  }

  const entries: Array<
    | {
        endpointName: "findTokenById";
        arg: { id: string };
        value: TokenCurrency | undefined;
      }
    | {
        endpointName: "findTokenByAddressInCurrency";
        arg: {
          contract_address: string;
          network: string;
          token_identifier?: string;
        };
        value: TokenCurrency | undefined;
      }
  > = [];

  for (const entry of tokensToRestore) {
    const token = entry.data;

    entries.push({
      endpointName: "findTokenById",
      arg: { id: token.id },
      value: token,
    });

    entries.push({
      endpointName: "findTokenByAddressInCurrency",
      arg: {
        contract_address: token.contractAddress,
        network: token.parentCurrencyId,
        ...(entry.token_identifier === undefined
          ? {}
          : { token_identifier: entry.token_identifier }),
      },
      value: token,
    });

    // Also restore the address-only key so lookups without token_identifier hit the cache.
    // Collision on chains where address is not unique is a coin-level concern.
    if (entry.token_identifier !== undefined) {
      entries.push({
        endpointName: "findTokenByAddressInCurrency",
        arg: {
          contract_address: token.contractAddress,
          network: token.parentCurrencyId,
        },
        value: token,
      });
    }
  }

  if (entries.length > 0) {
    dispatch(cryptoAssetsApi.util.upsertQueryEntries(entries));
  }
}
