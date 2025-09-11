import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { log } from "@ledgerhq/logs";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import {
  tokensByAddress,
  tokensById,
  tokensByTicker,
  tokensByCurrencyAddress,
} from "@ledgerhq/cryptoassets/legacy/legacy-state";

// Initialize legacy tokens only once for fallback
let legacyTokensInitialized = false;

/**
 * Transition wrapper: tries legacy first (local tokens), fallback to new store (API + cache)
 *
 * Usage:
 *   const store = withLegacyFallback(new CachedCryptoAssetsStore(reduxStore));
 *
 * To remove transition (single line change):
 *   const store = new CachedCryptoAssetsStore(reduxStore);
 */
export function withLegacyFallback(newStore: CryptoAssetsStore): CryptoAssetsStore {
  // Initialize legacy tokens only when using fallback
  if (!legacyTokensInitialized) {
    legacyTokensInitialized = true;
    initializeLegacyTokens(addTokens);
    log("crypto-assets-cache", "Legacy tokens initialized for fallback");
  }

  return {
    async findTokenByAddress(address: string): Promise<TokenCurrency | undefined> {
      // 1. Try legacy first (local tokens)
      const legacyResult = tokensByAddress[address.toLowerCase()];
      if (legacyResult) {
        log("crypto-assets-cache", `Legacy fallback hit for address:${address}`);
        return legacyResult;
      }

      // 2. Fallback to new store (API + cache)
      return newStore.findTokenByAddress(address);
    },

    async getTokenById(id: string): Promise<TokenCurrency> {
      // 1. Try legacy first (local tokens)
      const legacyResult = tokensById[id];
      if (legacyResult) {
        log("crypto-assets-cache", `Legacy fallback hit for id:${id}`);
        return legacyResult;
      }

      // 2. Fallback to new store (API + cache)
      return newStore.getTokenById(id);
    },

    async findTokenById(id: string): Promise<TokenCurrency | undefined> {
      // 1. Try legacy first (local tokens)
      const legacyResult = tokensById[id];
      if (legacyResult) {
        log("crypto-assets-cache", `Legacy fallback hit for id:${id}`);
        return legacyResult;
      }

      // 2. Fallback to new store (API + cache)
      return newStore.findTokenById(id);
    },

    async findTokenByAddressInCurrency(
      address: string,
      currencyId: string,
    ): Promise<TokenCurrency | undefined> {
      // 1. Try legacy first (local tokens)
      const legacyResult = tokensByCurrencyAddress[currencyId + ":" + address.toLowerCase()];
      if (legacyResult) {
        log(
          "crypto-assets-cache",
          `Legacy fallback hit for address:${address} currency:${currencyId}`,
        );
        return legacyResult;
      }

      // 2. Fallback to new store (API + cache)
      return newStore.findTokenByAddressInCurrency(address, currencyId);
    },

    async findTokenByTicker(ticker: string): Promise<TokenCurrency | undefined> {
      // 1. Try legacy first (local tokens)
      const legacyResult = tokensByTicker[ticker];
      if (legacyResult) {
        log("crypto-assets-cache", `Legacy fallback hit for ticker:${ticker}`);
        return legacyResult;
      }

      // 2. Fallback to new store (API + cache)
      return newStore.findTokenByTicker(ticker);
    },
  };
}
