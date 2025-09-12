/**
 * BEWARE: this file will progressively disappear when https://github.com/LedgerHQ/ledger-live/pull/11905 lands
 */

import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { initializeLegacyTokens } from "./legacy/legacy-data";
import {
  addTokens as addTokensLegacy,
  listTokensLegacy,
  listTokensForCryptoCurrencyLegacy,
  type TokensListOptions,
} from "./legacy/legacy-utils";
import { legacyCryptoAssetsStore } from "./legacy/legacy-store";
import { tokensById } from "./legacy/legacy-state";
// Initialize legacy tokens
initializeLegacyTokens(addTokensLegacy);

// Re-export from legacy module
export { legacyCryptoAssetsStore, tokensById };

// Re-export from legacy for compatibility
export type { TokensListOptions };

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
