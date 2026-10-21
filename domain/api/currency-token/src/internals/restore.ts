import type { TokenCurrency } from "@domain/entity-currency-token";
import type { PersistedTokenEntry } from "../types";

// Package-private cache-restoration helpers for `restoreTokensToCache`.

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

type HashCacheEntry = { endpointName: "getTokensSyncHash"; arg: string; value: string };

/** Builds a `getTokensSyncHash` cache entry per stored `currencyId → hash`. */
export function buildHashCacheEntries(hashes: Record<string, string>): HashCacheEntry[] {
  return Object.entries(hashes).map(([currencyId, hash]) => ({
    endpointName: "getTokensSyncHash",
    arg: currencyId,
    value: hash,
  }));
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
