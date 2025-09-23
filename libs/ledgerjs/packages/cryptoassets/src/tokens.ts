import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  initializeLegacyTokens,
  addTokens as addTokensLegacy,
  listTokensLegacy,
  listTokensForCryptoCurrencyLegacy,
  type TokensListOptions,
} from "./legacy";
import {
  tokensById,
  tokensByTicker,
  tokensByAddress,
  tokensByCurrencyAddress,
} from "./legacy-state";

// Re-export types for compatibility
export type { TokensListOptions };

// Store reference for dependency injection
let cryptoAssetsStore: CryptoAssetsStore | undefined = undefined;


/**
 * Set the CryptoAssetsStore instance to use for token operations
 * This must be called before using any token functions
 */
export function setCryptoAssetsStoreForTokens(store: CryptoAssetsStore): void {
  cryptoAssetsStore = store;
}

/**
 * Get the configured CryptoAssetsStore instance
 * @private
 */
function getCryptoAssetsStore(): CryptoAssetsStore {
  if (!cryptoAssetsStore) {
    throw new Error("CryptoAssetsStore not configured. Call setCryptoAssetsStoreForTokens first.");
  }
  return cryptoAssetsStore;
}

/**
 * Find a token by its ticker using the async CryptoAssetsStore
 */
export async function findTokenByTicker(ticker: string): Promise<TokenCurrency | undefined> {
  const store = getCryptoAssetsStore();
  return await store.findTokenByTicker(ticker);
}

/**
 * Find a token by its ID using the async CryptoAssetsStore
 */
export async function findTokenById(id: string): Promise<TokenCurrency | undefined> {
  const store = getCryptoAssetsStore();
  return await store.findTokenById(id);
}

/**
 * Get a token by its ID using the async CryptoAssetsStore
 * Throws if the token is not found
 */
export async function getTokenById(id: string): Promise<TokenCurrency> {
  const store = getCryptoAssetsStore();
  return await store.getTokenById(id);
}

let deprecatedDisplayed = false;

/**
 * @deprecated, use findTokenByAddressInCurrency instead
 */
export async function findTokenByAddress(address: string): Promise<TokenCurrency | undefined> {
  if (!deprecatedDisplayed) {
    deprecatedDisplayed = true;
    console.warn("findTokenByAddress is deprecated. use findTokenByAddressInCurrency");
  }
  const store = getCryptoAssetsStore();
  return await store.findTokenByAddress(address);
}

/**
 * Find a token by its contract address and parent currency using the async CryptoAssetsStore
 */
export async function findTokenByAddressInCurrency(
  address: string,
  currencyId: string,
): Promise<TokenCurrency | undefined> {
  const store = getCryptoAssetsStore();
  return await store.findTokenByAddressInCurrency(address, currencyId);
}

/**
 * @deprecated use findTokenById instead
 */
export function hasTokenId(_id: string): boolean {
  console.warn("hasTokenId is deprecated and always returns false. Use findTokenById instead.");
  return false;
}

// Legacy list functions - deprecated and return empty arrays

/**
 * @deprecated This function is deprecated since tokens will no longer be listable as we moved to DaDa API everywhere
 * Use the new async token API instead
 */
export function listTokens(options?: Partial<TokensListOptions>): TokenCurrency[] {
  console.warn("listTokens is deprecated. Use the new async token API instead.");

  // POC: Return empty array to avoid bundling legacy data
  const tokens: TokenCurrency[] = []; // Object.values(tokensById);

  if (!options) {
    return tokens;
  }

  return tokens.filter(token => {
    if (options.withDelisted === false && token.delisted) {
      return false;
    }
    return true;
  });
}

/**
 * @deprecated This function is deprecated since tokens will no longer be listable as we moved to DaDa API everywhere
 * Use the new async token API instead
 */
export function listTokensForCryptoCurrency(
  currency: CryptoCurrency,
  options?: Partial<TokensListOptions>,
): TokenCurrency[] {
  console.warn("listTokensForCryptoCurrency is deprecated. Use the new async token API instead.");

  // POC: Return empty array to avoid bundling legacy data
  const tokens: TokenCurrency[] = []; // Object.values(tokensById).filter(token => token.parentCurrency === currency);

  if (!options) {
    return tokens;
  }

  return tokens.filter(token => {
    if (options.withDelisted === false && token.delisted) {
      return false;
    }
    return true;
  });
}

/**
 *
 */
export function listTokenTypesForCryptoCurrency(currency: CryptoCurrency): string[] {
  return currency.tokenTypes || [];
}

/**
 * @deprecated
 */
export function addTokens(_tokens: (TokenCurrency | undefined)[]): void {
  console.warn("addTokens is deprecated and does nothing. Use the new async token API instead.");
  // No-op: we don't maintain a local token list anymore
}
