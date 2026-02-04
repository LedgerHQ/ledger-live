/**
 * Token persistence utilities for CryptoAssetsStore
 * Handles extracting, saving, and restoring tokens from RTK Query cache
 */

import isEqual from "lodash/isEqual";
import { log } from "@ledgerhq/logs";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "../currencies";
import { cryptoAssetsApi } from "./state-manager/api";
import type { ThunkDispatch } from "@reduxjs/toolkit";

/**
 * Current version of the persistence format
 * Increment this when making breaking changes to the format
 */
export const PERSISTENCE_VERSION = 2;

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
export interface PersistedCAL {
  /** Format version for migration handling */
  version: number;
  /** Array of persisted tokens */
  tokens: PersistedTokenEntry[];
  /** Mapping of currencyId to X-Ledger-Commit hash */
  hashes?: Record<string, string>;
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
  for (const [_queryKey, query] of Object.entries(rtkState.queries)) {
    if (
      query &&
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
 * Extracts hashes from getTokensSyncHash queries in RTK Query state
 * Returns a mapping of currencyId to hash
 */
export function extractHashesFromState(state: StateWithCryptoAssets): Record<string, string> {
  const rtkState = state[cryptoAssetsApi.reducerPath];

  if (!rtkState || !rtkState.queries) {
    return {};
  }

  const hashes: Record<string, string> = {};

  // Extract hashes from fulfilled getTokensSyncHash queries
  for (const [queryKey, query] of Object.entries(rtkState.queries)) {
    if (
      query &&
      query.status === "fulfilled" &&
      query.endpointName === "getTokensSyncHash" &&
      query.data &&
      typeof query.data === "string"
    ) {
      // Extract currencyId from query key (format: 'getTokensSyncHash("ethereum")')
      const match = queryKey.match(/getTokensSyncHash\("([^"]+)"\)/);
      if (match && match[1]) {
        hashes[match[1]] = query.data;
      }
    }
  }

  return hashes;
}

/**
 * Extracts all persisted data (tokens and hashes) from RTK Query state
 * Returns a complete PersistedCAL object ready for serialization
 */
export function extractPersistedCALFromState(state: StateWithCryptoAssets): PersistedCAL {
  const tokens = extractTokensFromState(state);
  const hashes = extractHashesFromState(state);

  return {
    version: PERSISTENCE_VERSION,
    tokens,
    ...(Object.keys(hashes).length > 0 && { hashes }),
  };
}

function tokenCurrencyRawEqual(a: TokenCurrencyRaw, b: TokenCurrencyRaw): boolean {
  return isEqual(a, b);
}

/**
 * Compares two PersistedCAL values by content (version, hashes, token data).
 * Ignores token timestamps so that refetches with identical cache content are considered equal.
 * Returns true only when both are null or both are content-equal.
 */
export function persistedCALContentEqual(a: PersistedCAL | null, b: PersistedCAL | null): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a.version !== b.version) return false;
  if (!isEqual(a.hashes, b.hashes)) return false;
  if (a.tokens.length !== b.tokens.length) return false;
  const tokensByIdA = new Map(a.tokens.map(t => [t.data.id, t.data]));
  const tokensByIdB = new Map(b.tokens.map(t => [t.data.id, t.data]));
  const entriesA = Array.from(tokensByIdA.entries());
  for (let i = 0; i < entriesA.length; i++) {
    const [id, dataA] = entriesA[i];
    const dataB = tokensByIdB.get(id);
    if (!dataB || !tokenCurrencyRawEqual(dataA, dataB)) return false;
  }
  return true;
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
 * Restores tokens from persisted data to RTK Query cache.
 * Validates persisted hashes against current hashes and evicts cache if they differ.
 */
export async function restoreTokensToCache(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: ThunkDispatch<any, any, any>,
  persistedData: PersistedCAL,
  ttl: number,
): Promise<void> {
  const validTokens = filterExpiredTokens(persistedData.tokens, ttl);
  if (validTokens.length === 0) {
    log("persistence", "No valid tokens to restore");
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
        cryptoAssetsApi.endpoints.getTokensSyncHash.initiate(currencyId, { forceRefetch: false }),
      );
      const currentHash = currentHashResult.data;

      if (currentHash && currentHash !== storedHash) {
        log(
          "persistence",
          `Hash changed for currencyId ${currencyId}: ${storedHash} -> ${currentHash}, skipping restore`,
        );
        currencyIdsToEvict.add(currencyId);
      }
    } catch (error) {
      log(
        "persistence",
        `Failed to validate hash for currencyId ${currencyId}, skipping restore`,
        error,
      );
      currencyIdsToEvict.add(currencyId);
    }
  }

  const tokensToRestore = validTokens.filter(
    entry => !currencyIdsToEvict.has(entry.data.parentCurrencyId),
  );

  if (tokensToRestore.length === 0) {
    log("persistence", "No tokens to restore after hash validation");
    return;
  }

  const entries: Array<
    | { endpointName: "findTokenById"; arg: { id: string }; value: TokenCurrency | undefined }
    | {
        endpointName: "findTokenByAddressInCurrency";
        arg: { contract_address: string; network: string };
        value: TokenCurrency | undefined;
      }
  > = [];

  let skipped = 0;
  for (const entry of tokensToRestore) {
    const token = fromTokenCurrencyRaw(entry.data);
    if (!token) {
      skipped++;
      continue;
    }

    entries.push({
      endpointName: "findTokenById",
      arg: { id: token.id },
      value: token,
    });

    entries.push({
      endpointName: "findTokenByAddressInCurrency",
      arg: {
        contract_address: token.contractAddress,
        network: token.parentCurrency.id,
      },
      value: token,
    });
  }

  if (entries.length > 0) {
    dispatch(cryptoAssetsApi.util.upsertQueryEntries(entries));
  }

  log(
    "persistence",
    `Restored ${tokensToRestore.length - skipped} tokens (${entries.length} entries, ${skipped} skipped, ${currencyIdsToEvict.size} currencies evicted)`,
  );
}
