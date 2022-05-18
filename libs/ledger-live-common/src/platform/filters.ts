import { PlatformAccount, PlatformCurrency } from "./types";
import { makeRe } from "minimatch";

export { makeRe } from "minimatch";

export type AccountFilters = {
  currencies?: string[];
};

export function filterPlatformAccounts(
  accounts: PlatformAccount[],
  filters: AccountFilters
): PlatformAccount[] {
  const filterCurrencyRegexes = filters.currencies
    ? filters.currencies.map((filter) => makeRe(filter))
    : null;

  return accounts.filter((account) => {
    if (
      filterCurrencyRegexes &&
      !filterCurrencyRegexes.some((regex) => account.currency.match(regex))
    ) {
      return false;
    }
    return true;
  });
}

export type CurrencyFilters = {
  includeTokens?: boolean;
  currencies?: string[];
};

export function filterPlatformCurrencies(
  currencies: PlatformCurrency[],
  filters: CurrencyFilters
): PlatformCurrency[] {
  const filterCurrencyRegexes = filters.currencies
    ? filters.currencies.map((filter) => makeRe(filter))
    : null;

  return currencies.filter((currency) => {
    if (!filters.includeTokens && currency.type === "TokenCurrency") {
      return false;
    }

    if (
      filterCurrencyRegexes &&
      !filterCurrencyRegexes.some((regex) => currency.id.match(regex))
    ) {
      return false;
    }

    return true;
  });
}
