// @flow
import type { App } from "../types/manager";
import type { InstalledItem } from "./types";
import { getCryptoCurrencyById, isCurrencySupported } from "../currencies";
import { useMemo } from "react";

export type SortOptions = {
  type: "name" | "marketcap" | "default",
  order: "asc" | "desc"
};

export type FilterOptions = {
  query?: string,
  installedApps: InstalledItem[],
  type: "all" | "installed" | "not_installed" | "supported" | "updatable"
};

type UpdateAwareInstalledApps = {
  [string]: boolean // NB [AppName]: isUpdated
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
  const { query, installedApps, type = "all" } = _options;
  const updateAwareInstalledApps: UpdateAwareInstalledApps = {};
  for (let i = 0; i < installedApps.length; i++) {
    updateAwareInstalledApps[installedApps[i].name] = installedApps[i].updated;
  }

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

export const useSortedFilteredApps = (
  apps: App[],
  _filterOptions: FilterOptions,
  _sortOptions: SortOptions
) => {
  const { query, installedApps, type: filterType } = _filterOptions;
  const { type: sortType, order } = _sortOptions;

  return useMemo(
    () => sortApps(filterApps(apps, _filterOptions), _sortOptions),
    [apps, query, installedApps, filterType, sortType, order]
  );
};
