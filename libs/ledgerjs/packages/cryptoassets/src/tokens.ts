/**
 * BEWARE: this file will progressively disappear when https://github.com/LedgerHQ/ledger-live/pull/11905 lands
 */

import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  addTokens,
  listTokensLegacy,
  listTokensForCryptoCurrencyLegacy,
  type TokensListOptions,
  __clearAllLists,
  convertERC20,
  convertAlgorandASATokens,
  convertVechainToken,
  convertTRONTokens,
  convertMultiversXESDTTokens,
  convertCardanoNativeTokens,
  convertStellarTokens,
  convertJettonToken,
  convertSplTokens,
  convertSuiTokens,
  convertAptCoinTokens,
  convertAptFaTokens,
  convertHederaTokens,
} from "./legacy/legacy-utils";
import { tokensByCurrencyAddress, tokensById } from "./legacy/legacy-state";
import { legacyCryptoAssetsStore } from "./legacy/legacy-store";

export {
  addTokens,
  convertERC20,
  convertAlgorandASATokens,
  convertVechainToken,
  convertTRONTokens,
  convertMultiversXESDTTokens,
  convertCardanoNativeTokens,
  convertStellarTokens,
  convertJettonToken,
  convertSplTokens,
  convertSuiTokens,
  convertAptCoinTokens,
  convertAptFaTokens,
  convertHederaTokens,
  __clearAllLists,
  legacyCryptoAssetsStore,
};

/**
 * @deprecated Please do `await getCryptoAssetsStore().findTokenById(id)` instead to anticipate https://github.com/LedgerHQ/ledger-live/pull/11905
 */
export function findTokenById(id: string): TokenCurrency | undefined {
  return tokensById[id];
}

/**
 * @deprecated Please do `await getCryptoAssetsStore().findTokenByAddress(address, currencyId)` instead to anticipate https://github.com/LedgerHQ/ledger-live/pull/11905
 */
export function findTokenByAddressInCurrency(
  address: string,
  currencyId: string,
): TokenCurrency | undefined {
  return tokensByCurrencyAddress[currencyId + ":" + address.toLowerCase()];
}

/**
 * @deprecated This function is deprecated. See https://ledgerhq.atlassian.net/browse/LIVE-21646
 * Tokens will no longer be listable as we moved to DaDa API when possible / or CAL API directly.
 */
export function listTokens(options?: Partial<TokensListOptions>): TokenCurrency[] {
  return listTokensLegacy(options);
}

/**
 * @deprecated This function is deprecated. See https://ledgerhq.atlassian.net/browse/LIVE-21646
 * Tokens will no longer be listable as we moved to DaDa API when possible / or CAL API directly.
 */
export function listTokensForCryptoCurrency(
  currency: CryptoCurrency,
  options?: Partial<TokensListOptions>,
): TokenCurrency[] {
  return listTokensForCryptoCurrencyLegacy(currency, options);
}

/**
 * @deprecated Prefer using currency.tokenTypes directly.
 */
export function listTokenTypesForCryptoCurrency(currency: CryptoCurrency): string[] {
  return currency.tokenTypes || [];
}
