// @flow
import type { App } from "../types/manager";
import type { InstalledItem } from "./types";
import { getCryptoCurrencyById, isCurrencySupported } from "../currencies";

export type SortOptions = {
  type: "name" | "marketcap",
  order: "asc" | "desc",
  marketcapTickers?: string[]
};

export type FilterOptions = {
  query?: string,
  installedApps: InstalledItem[],
  type: "all" | "installed" | "not_installed" | "supported" | "updatable"
};

type UpdateAwareInstalledApps = {
  [string]: boolean // NB [AppName]: isUpdated
};

type ScoredApps = {
  [string]: number // NB [AppName]: computed score for sorting
};

const searchFilter = (query?: string) => ({ name, currencyId }) => {
  if (!query) return true;
  const currency = currencyId ? getCryptoCurrencyById(currencyId) : null;
  const terms = `${name} ${
    currency ? `${currency.name} ${currency.ticker}` : ""
  }`;
  return terms.toLowerCase().includes(query.toLowerCase().trim());
};

const typeFilter = (
  type = "all",
  updateAwareInstalledApps: UpdateAwareInstalledApps
) => app => {
  switch (type) {
    case "installed":
      return updateAwareInstalledApps.hasOwnProperty(app.name);
    case "not_installed":
      return !updateAwareInstalledApps.hasOwnProperty(app.name);
    case "updatable":
      return (
        updateAwareInstalledApps.hasOwnProperty(app.name) &&
        !updateAwareInstalledApps[app.name]
      );
    case "supported":
      return (
        app.currencyId &&
        isCurrencySupported(getCryptoCurrencyById(app.currencyId))
      );
    default:
      return true;
  }
};

export const sortApps = (apps: App[], _options: SortOptions): App[] => {
  const { type, marketcapTickers, order } = _options;
  const asc = order === "asc";
  const sortedApps = [...apps];
  const marketcapScoreBase = 10e6;

  const scoredApps: ScoredApps = sortedApps.reduce(
    (names, { name, currencyId }) => {
      let appScore = 0;

      if (marketcapTickers && type === "marketcap" && currencyId) {
        const index = marketcapTickers.indexOf(
          getCryptoCurrencyById(currencyId).ticker
        );

        appScore += index >= 0 ? marketcapScoreBase - 1000 * index : 0;
      }

      // By name
      appScore += name[0].toLowerCase().charCodeAt(0);

      return { ...names, [name]: appScore * (asc ? 1 : -1) };
    },
    {}
  );

  return sortedApps.sort(
    (app1, app2) => scoredApps[app1.name] - scoredApps[app2.name]
  );
};

export const filterApps = (apps: App[], _options: FilterOptions): App[] => {
  const { query, installedApps, type = "all" } = _options;
  const updateAwareInstalledApps = installedApps.reduce(
    (names, { name }) => ({ ...names, [name]: true }),
    {}
  );
  return apps
    .filter(searchFilter(query))
    .filter(typeFilter(type, updateAwareInstalledApps));
};

export const sortFilterApps = (
  apps: App[],
  _filterOptions: FilterOptions,
  _sortOptions: SortOptions
): App[] => {
  return sortApps(filterApps(apps, _filterOptions), _sortOptions);
};
