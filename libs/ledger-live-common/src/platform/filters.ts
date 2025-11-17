import { makeRe } from "minimatch";
import { AppPlatform, PlatformAccount } from "./types";

export type FilterParams = {
  branches?: string[];
  platform?: AppPlatform;
  private?: boolean;
  apiVersion?: string[] | string;
  llVersion?: string;
  lang?: string;
};

export type AccountFilters = {
  currencies?: string[];
};

export function filterPlatformAccounts(
  accounts: PlatformAccount[],
  filters: AccountFilters,
): PlatformAccount[] {
  const filterCurrencyRegexes = filters.currencies
    ? filters.currencies.map(filter => makeRe(filter))
    : null;

  return accounts.filter(account => {
    if (
      filterCurrencyRegexes &&
      !filterCurrencyRegexes.some(regex => account.currency.match(regex))
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
