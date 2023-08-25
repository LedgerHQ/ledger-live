import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { findTokenById } from "@ledgerhq/cryptoassets/tokens";
import { CryptoCurrency, CryptoOrTokenCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export function getCurrenciesAndTokens(currenciesAndTokenIds: string[]): CryptoOrTokenCurrency[] {
  const tokens = currenciesAndTokenIds
    .map(findTokenById)
    .filter((token): token is TokenCurrency => !!token);
  const cryptoCurrencies = currenciesAndTokenIds
    .map(findCryptoCurrencyById)
    .filter((currency): currency is CryptoCurrency => !!currency);
  return [...tokens, ...cryptoCurrencies];
}
