import {
  Currency,
  CryptoCurrency,
  CryptoOrTokenCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { makeRe } from "minimatch";
import { listTokens } from "@ledgerhq/cryptoassets";
import { listSupportedCurrencies } from "@ledgerhq/coin-framework/currencies/index";

export function isCryptoCurrency(
  currency: Currency
): currency is CryptoCurrency {
  return currency.type === "CryptoCurrency";
}

export function isTokenCurrency(currency: Currency): currency is TokenCurrency {
  return currency.type === "TokenCurrency";
}

export function listCurrencies(
  includeTokens: boolean
): CryptoOrTokenCurrency[] {
  const currencies = listSupportedCurrencies();

  if (!includeTokens) {
    return currencies;
  }

  const allTokens = listTokens();

  return [...currencies, ...allTokens];
}

export type CurrencyFilters = {
  currencies?: string[];
};

export function filterCurrencies(
  currencies: CryptoOrTokenCurrency[],
  filters: CurrencyFilters
): CryptoOrTokenCurrency[] {
  const filterCurrencyRegexes = filters.currencies
    ? filters.currencies.map((filter) => makeRe(filter))
    : null;

  return currencies.filter((currency) => {
    if (
      filterCurrencyRegexes &&
      filterCurrencyRegexes.length &&
      !filterCurrencyRegexes.some((regex) => currency.id.match(regex))
    ) {
      return false;
    }

    return true;
  });
}
