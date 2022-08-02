import type { InstalledItem } from "./types";
import { getCryptoCurrencyById, isCurrencySupported } from "../currencies";
import { useMemo } from "react";
import type { App } from "@ledgerhq/types-live";

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
};

type UpdateAwareInstalledApps = Record<string, boolean>;

const searchFilter =
  (query?: string) =>
  ({ name, currencyId }) => {
    if (!query) return true;
    // Nb allow for multiple comma separated search terms
    const queries = query
      .split(",")
      .map((t) => t.toLowerCase().trim())
      .filter(Boolean);
    const currency = currencyId ? getCryptoCurrencyById(currencyId) : null;
    const terms = `${name} ${
      currency ? `${currency.name} ${currency.ticker}` : ""
    }`;
    return queries.some((query) => terms.toLowerCase().includes(query));
  };

const typeFilter =
  (
    filters: AppType[] = ["all"],
    updateAwareInstalledApps: UpdateAwareInstalledApps,
    installQueue: string[] = []
  ) =>
  (app) =>
    filters.every((filter) => {
      switch (filter) {
        case "installed":
          return (
            installQueue.includes(app.name) ||
            app.name in updateAwareInstalledApps
          );

        case "not_installed":
          return !(app.name in updateAwareInstalledApps);

        case "updatable":
          return (
            app.name in updateAwareInstalledApps &&
            !updateAwareInstalledApps[app.name]
          );

        case "supported":
          return (
            app.currencyId &&
            isCurrencySupported(getCryptoCurrencyById(app.currencyId))
          );

        case "not_supported":
          return !(
            app.currencyId &&
            isCurrencySupported(getCryptoCurrencyById(app.currencyId))
          );

        default:
          return true;
      }
    });

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
    .filter(typeFilter(type, updateAwareInstalledApps, installQueue));
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
): App[] => {
  const {
    query,
    installedApps,
    type: filterType,
    installQueue,
  } = _filterOptions;
  const { type: sortType, order } = _sortOptions;
  return useMemo(
    () =>
      sortFilterApps(
        apps,
        {
          query,
          installedApps,
          type: filterType,
          installQueue,
        },
        {
          type: sortType,
          order,
        }
      ),
    [apps, query, installedApps, filterType, installQueue, sortType, order]
  );
};
