import type { ThunkDispatch } from "@reduxjs/toolkit";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { cryptoAssetsApi } from "../api";
import type { PersistedTokenEntry } from "../types";

// Package-private cache-restoration helpers for `restoreTokensToCache`. Imported directly by
// `persistence.ts` (not via the internals barrel) so `api.ts` → internals never forms a cycle.

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

/**
 * For each currency that has a stored hash, fetches the current server hash and returns the set of
 * currencies whose hash changed, or whose hash request CAL answered with an error — those must not be
 * restored from cache. A currency is kept when CAL is unreachable, since nothing fresher could replace
 * its tokens, and currencies without a stored hash are never evicted.
 */
export async function resolveCurrenciesToEvict(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dispatch: ThunkDispatch<any, any, any>,
  tokensByCurrency: Map<string, PersistedTokenEntry[]>,
  hashes: Record<string, string>,
): Promise<Set<string>> {
  const toEvict = new Set<string>();
  for (const currencyId of tokensByCurrency.keys()) {
    const storedHash = hashes[currencyId];
    if (!storedHash) continue;

    try {
      const { data: currentHash, error } = await dispatch(
        cryptoAssetsApi.endpoints.getTokensSyncHash.initiate(currencyId, { forceRefetch: false }),
      );
      // A failed request resolves with `error`; it never rejects.
      const calUnreachable =
        error !== undefined && "status" in error && error.status === "FETCH_ERROR";
      if (!calUnreachable && (error !== undefined || currentHash !== storedHash)) {
        toEvict.add(currencyId);
      }
    } catch {
      // `dispatch` throws synchronously when the store lacks the RTK Query middleware.
      toEvict.add(currencyId);
    }
  }
  return toEvict;
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
