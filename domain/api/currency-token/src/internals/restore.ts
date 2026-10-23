import type { TokenCurrency } from "@domain/entity-currency-token";
import type { PersistedTokenEntry } from "../types";

// Package-private cache-restoration helpers for `restoreTokensToCache`. Imported directly by
// `persistence.ts` (not via the internals barrel) so `api.ts` → internals never forms a cycle.

type RestoreCacheEntry =
  | { endpointName: "findTokenById"; arg: { id: string }; value: TokenCurrency | undefined }
  | {
      endpointName: "findTokenByAddressInCurrency";
      arg: { contract_address: string; network: string; token_identifier?: string };
      value: TokenCurrency | undefined;
    }
  | { endpointName: "getTokensSyncHash"; arg: string; value: string };

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

/** Builds a `getTokensSyncHash` cache entry per `currencyId → hash` pair. */
export function buildSyncHashCacheEntries(hashes: Record<string, string>): RestoreCacheEntry[] {
  return Object.entries(hashes).map(([currencyId, hash]) => ({
    endpointName: "getTokensSyncHash",
    arg: currencyId,
    value: hash,
  }));
}
