/**
 * Token persistence utilities for CryptoAssetsStore
 * Handles extracting, saving, and restoring tokens from RTK Query cache
 */

import { log } from "@ledgerhq/logs";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "../currencies";
import { cryptoAssetsApi } from "./state-manager/api";
import type { ThunkDispatch } from "@reduxjs/toolkit";

/**
 * Current version of the persistence format
 * Increment this when making breaking changes to the format
 */
export const PERSISTENCE_VERSION = 1;

/**
 * Serializable token format
 * This is TokenCurrency without the parentCurrency object (replaced by parentCurrencyId)
 */
export interface TokenCurrencyRaw {
  id: string;
  contractAddress: string;
  parentCurrencyId: string;
  tokenType: string;
  name: string;
  ticker: string;
  units: Array<{ name: string; code: string; magnitude: number }>;
  delisted?: boolean;
  disableCountervalue?: boolean;
  ledgerSignature?: string;
}

/**
 * Persisted token entry with timestamp
 */
export interface PersistedTokenEntry {
  /** Serializable token data */
  data: TokenCurrencyRaw;
  /** When this token was fetched (Unix timestamp in ms) */
  timestamp: number;
}

/**
 * Root persistence format with versioning
 */
export interface PersistedTokens {
  /** Format version for migration handling */
  version: number;
  /** Array of persisted tokens */
  tokens: PersistedTokenEntry[];
}

/**
 * Converts TokenCurrency to serializable Raw format
 */
export function toTokenCurrencyRaw(token: TokenCurrency): TokenCurrencyRaw {
  return {
    id: token.id,
    contractAddress: token.contractAddress,
    parentCurrencyId: token.parentCurrency.id,
    tokenType: token.tokenType,
    name: token.name,
    ticker: token.ticker,
    units: token.units,
    delisted: token.delisted,
    disableCountervalue: token.disableCountervalue,
    ledgerSignature: token.ledgerSignature,
  };
}

/**
 * Converts Raw format back to TokenCurrency
 * Returns undefined if parent currency is not found
 */
export function fromTokenCurrencyRaw(raw: TokenCurrencyRaw): TokenCurrency | undefined {
  const parentCurrency = findCryptoCurrencyById(raw.parentCurrencyId);
  if (!parentCurrency) {
    log("persistence", `Parent currency not found: ${raw.parentCurrencyId}`);
    return undefined;
  }

  return {
    type: "TokenCurrency",
    id: raw.id,
    contractAddress: raw.contractAddress,
    parentCurrency,
    tokenType: raw.tokenType,
    name: raw.name,
    ticker: raw.ticker,
    units: raw.units,
    delisted: raw.delisted,
    disableCountervalue: raw.disableCountervalue,
    ledgerSignature: raw.ledgerSignature,
  };
}

/**
 * Redux state that includes the cryptoAssetsApi reducer
 */
export interface StateWithCryptoAssets {
  [cryptoAssetsApi.reducerPath]: ReturnType<typeof cryptoAssetsApi.reducer>;
}

/**
 * Extracts all cached tokens from RTK Query state
 * Only includes fulfilled queries for findTokenById and findTokenByAddressInCurrency
 * Converts tokens to serializable format
 */
export function extractTokensFromState(state: StateWithCryptoAssets): PersistedTokenEntry[] {
  const rtkState = state[cryptoAssetsApi.reducerPath];

  if (!rtkState || !rtkState.queries) {
    log("persistence", "No RTK Query state found");
    return [];
  }

  const tokens: PersistedTokenEntry[] = [];
  const seenIds = new Set<string>();

  // Extract tokens from fulfilled queries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const [_queryKey, query] of Object.entries(rtkState.queries as Record<string, any>)) {
    if (
      query.status === "fulfilled" &&
      query.data &&
      (query.endpointName === "findTokenById" ||
        query.endpointName === "findTokenByAddressInCurrency")
    ) {
      const token = query.data as TokenCurrency | undefined;

      // Deduplicate by token ID
      if (token && token.id && !seenIds.has(token.id)) {
        seenIds.add(token.id);
        tokens.push({
          data: toTokenCurrencyRaw(token),
          timestamp: query.fulfilledTimeStamp || Date.now(),
        });
      }
    }
  }

  log("persistence", `Extracted ${tokens.length} tokens from cache`);
  return tokens;
}

/**
 * Filters out expired tokens based on TTL
 */
export function filterExpiredTokens(
  tokens: PersistedTokenEntry[],
  ttl: number,
): PersistedTokenEntry[] {
  const now = Date.now();
  const validTokens = tokens.filter(token => {
    const age = now - token.timestamp;
    return age < ttl;
  });

  const expired = tokens.length - validTokens.length;
  if (expired > 0) {
    log("persistence", `Filtered out ${expired} expired tokens`);
  }

  return validTokens;
}

/**
 * Restores tokens from persisted data to RTK Query cache
 * Uses upsertQueryEntries to insert final TokenCurrency values (no transformResponse)
 * Implements cross-caching: stores tokens by both ID and address
 *
 * @param dispatch - Redux dispatch function
 * @param tokens - Array of persisted token entries
 * @param ttl - Time-to-live in milliseconds (tokens older than this are skipped)
 */
export function restoreTokensToCache(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: ThunkDispatch<any, any, any>,
  tokens: PersistedTokenEntry[],
  ttl: number,
): void {
  const validTokens = filterExpiredTokens(tokens, ttl);

  if (validTokens.length === 0) {
    log("persistence", "No valid tokens to restore");
    return;
  }

  // Build entries for upsertQueryEntries
  // Each token needs to be cached under both ID and address lookups
  const entries: Array<
    | {
        endpointName: "findTokenById";
        arg: { id: string };
        value: TokenCurrency | undefined;
      }
    | {
        endpointName: "findTokenByAddressInCurrency";
        arg: { contract_address: string; network: string };
        value: TokenCurrency | undefined;
      }
  > = [];

  let skipped = 0;

  for (const entry of validTokens) {
    // Convert Raw format back to TokenCurrency
    const token = fromTokenCurrencyRaw(entry.data);

    if (!token) {
      // Conversion failed (e.g., parent currency not found), skip this token
      skipped++;
      continue;
    }

    // Cache by ID
    entries.push({
      endpointName: "findTokenById",
      arg: { id: token.id },
      value: token,
    });

    // Cross-cache by address (for findTokenByAddressInCurrency queries)
    entries.push({
      endpointName: "findTokenByAddressInCurrency",
      arg: {
        contract_address: token.contractAddress,
        network: token.parentCurrency.id,
      },
      value: token,
    });
  }

  // Dispatch single upsertQueryEntries action with all entries
  if (entries.length > 0) {
    dispatch(cryptoAssetsApi.util.upsertQueryEntries(entries));
  }

  log(
    "persistence",
    `Restored ${validTokens.length - skipped} tokens to cache (${entries.length} entries, ${skipped} skipped)`,
  );
}
