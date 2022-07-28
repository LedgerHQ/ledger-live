import { makeRe } from "minimatch";
import { PlatformAccount, PlatformCurrency, AppManifest } from "./types";
import { isPlatformTokenCurrency } from "./helpers";
import semver from "semver";

export type FilterParams = {
  branches?: string[];
  platform?: string;
  private?: boolean;
  version?: string;
};

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
    if (!filters.includeTokens && isPlatformTokenCurrency(currency)) {
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

function matchVersion(filterParams: FilterParams, manifest: AppManifest) {
  return (
    !filterParams.version ||
    semver.satisfies(filterParams.version, manifest.apiVersion)
  );
}

function matchBranches(filterParams: FilterParams, manifest: AppManifest) {
  return (
    !filterParams.branches || filterParams.branches.includes(manifest.branch)
  );
}

function matchPlatform(filterParams: FilterParams, manifest: AppManifest) {
  return (
    !filterParams.platform ||
    manifest.platform === "all" ||
    filterParams.platform === manifest.platform
  );
}

function matchPrivate(filterParams: FilterParams, manifest: AppManifest) {
  return filterParams.private === true || !(manifest.private === true);
}

export function filterPlatformApps(
  appManifests: AppManifest[],
  filterParams: FilterParams
): AppManifest[] {
  return appManifests.filter((appManifest: AppManifest) => {
    return (
      matchBranches(filterParams, appManifest) &&
      matchPlatform(filterParams, appManifest) &&
      matchPrivate(filterParams, appManifest) &&
      matchVersion(filterParams, appManifest)
    );
  });
}
