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

// Initialize legacy tokens
initializeLegacyTokens(addTokensLegacy);

// Re-export from legacy for compatibility
export type { TokensListOptions };

/**
 * NB: implementation is currently hooked to the legacy token store, but will be moved to the new async token store in the future
 */
export async function findTokenByTicker(ticker: string): Promise<TokenCurrency | undefined> {
  return tokensByTicker[ticker];
}

/**
 * NB: implementation is currently hooked to the legacy token store, but will be moved to the new async token store in the future
 */
export async function findTokenById(id: string): Promise<TokenCurrency | undefined> {
  return tokensById[id];
}

let deprecatedDisplayed = false;

/**
 * @deprecated, use findTokenByAdressInCurrency instead
 * NB: implementation is currently hooked to the legacy token store, but will be moved to the new async token store in the future
 */
export async function findTokenByAddress(address: string): Promise<TokenCurrency | undefined> {
  if (!deprecatedDisplayed) {
    deprecatedDisplayed = true;
    console.warn("findTokenByAddress is deprecated. use findTokenByAddressInCurrency");
  }
  return tokensByAddress[address.toLowerCase()];
}

/**
 * NB: implementation is currently hooked to the legacy token store, but will be moved to the new async token store in the future
 */
export async function findTokenByAddressInCurrency(
  address: string,
  currencyId: string,
): Promise<TokenCurrency | undefined> {
  return tokensByCurrencyAddress[currencyId + ":" + address.toLowerCase()];
}

/**
 * @deprecated use findTokenById instead
 */
export function hasTokenId(id: string): boolean {
  return id in tokensById;
}

/**
 * NB: implementation is currently hooked to the legacy token store, but will be moved to the new async token store in the future
 */
export async function getTokenById(id: string): Promise<TokenCurrency> {
  const currency = await findTokenById(id);

  if (!currency) {
    throw new Error(`token with id "${id}" not found`);
  }

  return currency;
}

// Legacy functions - moved to legacy module

/**
 * @deprecated This function is deprecated since tokens will no longer be listable as we moved to DaDa API everywhere
 * Use the new async token API instead
 */
export function listTokens(options?: Partial<TokensListOptions>): TokenCurrency[] {
  return listTokensLegacy(options);
}

/**
 * @deprecated This function is deprecated since tokens will no longer be listable as we moved to DaDa API everywhere
 * Use the new async token API instead
 */
export function listTokensForCryptoCurrency(
  currency: CryptoCurrency,
  options?: Partial<TokensListOptions>,
): TokenCurrency[] {
  return listTokensForCryptoCurrencyLegacy(currency, options);
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
export function addTokens(tokens: (TokenCurrency | undefined)[]): void {
  addTokensLegacy(tokens);
}
