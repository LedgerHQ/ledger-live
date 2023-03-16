import { makeRe } from "minimatch";
import {
  isCryptoCurrency,
  isTokenCurrency,
  listCurrencies,
} from "../currencies";
import { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import {
  PlatformCurrency,
  PlatformSupportedCurrency,
  PlatformERC20TokenCurrency,
  PlatformCryptoCurrency,
  PlatformCurrencyType,
  PLATFORM_FAMILIES,
} from "./types";
import { includes } from "../helpers";
import { CurrencyFilters } from "./filters";

export function isPlatformSupportedCurrency(
  currency: Currency
): currency is PlatformSupportedCurrency {
  if (isCryptoCurrency(currency)) {
    return includes(PLATFORM_FAMILIES, currency.family);
  }
  if (isTokenCurrency(currency)) {
    return includes(PLATFORM_FAMILIES, currency.parentCurrency.family);
  }
  return false;
}

export function isPlatformCryptoCurrency(
  currency: PlatformCurrency
): currency is PlatformCryptoCurrency {
  return currency.type === PlatformCurrencyType.CryptoCurrency;
}

export function isPlatformTokenCurrency(
  currency: PlatformCurrency
): currency is PlatformERC20TokenCurrency {
  return currency.type === PlatformCurrencyType.TokenCurrency;
}

export function isPlatformERC20TokenCurrency(
  currency: PlatformCurrency
): currency is PlatformERC20TokenCurrency {
  return (currency as PlatformERC20TokenCurrency).standard === "ERC20";
}

export function filterCurrencies(
  currencies: PlatformSupportedCurrency[],
  filters: CurrencyFilters
): CryptoOrTokenCurrency[] {
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
}: CurrencyFilters): CryptoOrTokenCurrency[] {
  // We removed the filtering with `isPlatformSupportedCurrency`
  // As we want to show all the currencies in the requestAccount drawer
  const allCurrencies = listCurrencies(includeTokens);

  return filterCurrencies(allCurrencies, {
    includeTokens,
    currencies,
  });
}
