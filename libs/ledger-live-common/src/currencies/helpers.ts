import { makeRe } from "minimatch";
import { CryptoCurrency, Currency, TokenCurrency } from "../types";
import { listTokens, listSupportedCurrencies } from "../currencies";
import { PlatformSupportedCurrency } from "../platform/types";
import { CurrencyFilters } from "../platform/filters";
import { isPlatformSupportedCurrency } from "../platform/helpers";

export function isCryptoCurrency(
  currency: Currency
): currency is CryptoCurrency {
  return currency.type === "CryptoCurrency";
}

export function isTokenCurrency(currency: Currency): currency is TokenCurrency {
  return currency.type === "TokenCurrency";
}

export function listCurrencies(includeTokens: boolean): Currency[] {
  const currencies = listSupportedCurrencies();

  if (!includeTokens) {
    return currencies;
  }

  const allTokens = listTokens().filter(
    ({ tokenType }) => tokenType === "erc20" || tokenType === "bep20"
  );

  return [...currencies, ...allTokens];
}

export function filterCurrencies(
  currencies: PlatformSupportedCurrency[],
  filters: CurrencyFilters
): Currency[] {
  const filterCurrencyRegexes = filters.currencies
    ? filters.currencies.map((filter) => makeRe(filter))
    : null;

  return currencies.filter((currency) => {
    if (!filters.includeTokens && isTokenCurrency(currency)) {
      return false;
    }

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

export function listAndFilterCurrencies({
  includeTokens = false,
  currencies,
}: CurrencyFilters): Currency[] {
  const allCurrencies = listCurrencies(includeTokens).filter(
    isPlatformSupportedCurrency
  );

  return filterCurrencies(allCurrencies, {
    includeTokens,
    currencies,
  });
}
