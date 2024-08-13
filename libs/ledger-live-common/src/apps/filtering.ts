import camelCase from "lodash/fp/camelCase";
import type { InstalledItem } from "./types";
import { getCryptoCurrencyById, isCurrencySupported } from "../currencies";
import { useMemo } from "react";
import type { App, Feature, FeatureId } from "@ledgerhq/types-live";

export type SortOptions = {
  type?: "name" | "marketcap" | "default";
  order?: "asc" | "desc";
};

export type AppType =
  | "all"
  | "installed"
  | "not_installed"
  | "supported"
  | "not_supported"
  | "updatable";

export type FilterOptions = {
  query?: string;
  installQueue?: string[];
  installedApps: InstalledItem[];
  type: AppType[];
  isFeature: (key: string) => boolean;
  getFeature: (key: FeatureId) => Feature | null;
};

type UpdateAwareInstalledApps = Record<string, boolean>;

const searchFilter =
  (query?: string) =>
  ({ name, currencyId }) => {
    if (!query) return true;
    // Nb allow for multiple comma separated search terms
    const queries = query
      .split(",")
      .map(t => t.toLowerCase().trim())
      .filter(Boolean);
    const currency = currencyId ? getCryptoCurrencyById(currencyId) : null;
    const terms = `${name} ${currency ? `${currency.name} ${currency.ticker}` : ""}`;
    return queries.some(query => terms.toLowerCase().includes(query));
  };

/**
 * Checks if the app's associated currency is supported in Ledger Live.
 *
 * It boils down to: if the app has a currencyId, check if the currency is supported.
 * The currency can be unsupported if there is a feature flag that disables it.
 */
export function isAppAssociatedCurrencySupported({
  app,
  isFeature,
  getFeature,
}: {
  app: App;
  isFeature: (key: string) => boolean;
  getFeature: (key: FeatureId) => Feature | null;
}): boolean {
  if (["swap", "plugin"].includes(app.type)) return true;
  if (!app.currencyId) return false;
  if (!isCurrencySupported(getCryptoCurrencyById(app.currencyId))) return false;

  const currencyFeatureKey = camelCase(`currency_${app.currencyId}`) as FeatureId;
  if (!isFeature(currencyFeatureKey)) return true; // no associated feature flag, the currency is supported
  if (getFeature(currencyFeatureKey)?.enabled === false) return false;
  return true;
}

function typeFilter(
  filters: AppType[] = ["all"],
  updateAwareInstalledApps: UpdateAwareInstalledApps,
  installQueue: string[] = [],
  isFeature: (key: string) => boolean,
  getFeature: (key: FeatureId) => Feature | null,
) {
  return (app: App): boolean =>
    filters.every(filter => {
      switch (filter) {
        case "installed":
          return installQueue.includes(app.name) || app.name in updateAwareInstalledApps;
        case "not_installed":
          return !(app.name in updateAwareInstalledApps);
        case "updatable":
          return app.name in updateAwareInstalledApps && !updateAwareInstalledApps[app.name];
        case "supported":
          return isAppAssociatedCurrencySupported({ app, isFeature, getFeature });
        case "not_supported":
          return !isAppAssociatedCurrencySupported({ app, isFeature, getFeature });
        default:
          return true;
      }
    });
}

export const sortApps = (apps: App[], _options: SortOptions): App[] => {
  const { type, order } = _options;
  const asc = order === "asc";
  if (type === "default") return apps;

  const getScore = ({ indexOfMarketCap: i }: App, reverse: boolean) =>
    i === -1 ? (reverse ? -10e6 : 10e6) : i;

  return [...apps].sort((a1, b1) => {
    const [a, b] = asc ? [a1, b1] : [b1, a1];
    let diff = 0;
    if (type === "marketcap") diff = getScore(b, asc) - getScore(a, asc);
    if (diff === 0) diff = a.name.localeCompare(b.name);
    return diff;
  });
};
export const filterApps = (apps: App[], _options: FilterOptions): App[] => {
  const { query, installedApps, installQueue, type = ["all"] } = _options;
  const updateAwareInstalledApps: UpdateAwareInstalledApps = {};

  for (let i = 0; i < installedApps.length; i++) {
    updateAwareInstalledApps[installedApps[i].name] = installedApps[i].updated;
  }

  return apps
    .filter(searchFilter(query))
    .filter(
      typeFilter(
        type,
        updateAwareInstalledApps,
        installQueue,
        _options.isFeature,
        _options.getFeature,
      ),
    );
};

export const sortFilterApps = (
  apps: App[],
  _filterOptions: FilterOptions,
  _sortOptions: SortOptions,
): App[] => {
  return sortApps(filterApps(apps, _filterOptions), _sortOptions);
};

export const useSortedFilteredApps = (
  apps: App[],
  _filterOptions: FilterOptions,
  _sortOptions: SortOptions,
): App[] => {
  return useMemo(
    () => sortFilterApps(apps, _filterOptions, _sortOptions),
    [apps, _filterOptions, _sortOptions],
  );
};
