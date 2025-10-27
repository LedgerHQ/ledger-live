/**
 * BEWARE: this file will progressively disappear when https://github.com/LedgerHQ/ledger-live/pull/11905 lands
 */

import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  listTokensLegacy,
  listTokensForCryptoCurrencyLegacy,
  type TokensListOptions,
} from "./legacy/legacy-utils";

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
