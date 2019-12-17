// @flow

import { initState } from "./logic";
import { deviceInfo155, mockListAppsResult } from "./mock";
import type { FilterOptions, SortOptions } from "./filtering";
import { sortFilterApps } from "./filtering";
import { setSupportedCurrencies } from "../data/cryptocurrencies";

type FilteringScenario = {
  name: string,
  apps: string,
  installed: string,
  expectedApps: string,
  _sortOptions: SortOptions,
  _filterOptions: FilterOptions
};
setSupportedCurrencies(["ethereum", "bitcoin", "dogecoin"]);

const apps =
  "Bitcoin, Ethereum, Litecoin, Dogecoin, HODL, Password Manager, Ethereum Classic, XRP, Stellar ";

const scenarios: FilteringScenario[] = [
  {
    name: "Catalog - Default sorting, no filters",
    apps,
    installed: "",
    _sortOptions: { type: "default", order: "asc" },
    _filterOptions: {},
    expectedApps:
      "Bitcoin, Ethereum, Litecoin, Dogecoin, HODL, Password Manager, Ethereum Classic, XRP, Stellar"
  },
  {
    name: "Catalog - Marketcap sorting, desc",
    apps,
    installed: "",
    _sortOptions: { type: "marketcap", order: "desc" },
    _filterOptions: {},
    expectedApps:
      "Bitcoin, Ethereum, XRP, Litecoin, Stellar, Ethereum Classic, Dogecoin, Password Manager, HODL"
  },
  {
    name: "Catalog - Marketcap sorting, asc",
    apps,
    installed: "",
    _sortOptions: { type: "marketcap", order: "asc" },
    _filterOptions: {},
    expectedApps:
      "Dogecoin, Ethereum Classic, Stellar, Litecoin, XRP, Ethereum, Bitcoin, HODL, Password Manager"
  },
  {
    name: "Catalog - Name sorting, desc",
    apps,
    installed: "",
    _sortOptions: { type: "name", order: "desc" },
    _filterOptions: {},
    expectedApps:
      "XRP, Stellar, Password Manager, Litecoin, HODL, Ethereum Classic, Ethereum, Dogecoin, Bitcoin"
  },
  {
    name: "Catalog - Name sorting, asc",
    apps,
    installed: "",
    _sortOptions: { type: "name", order: "asc" },
    _filterOptions: {},
    expectedApps:
      "Bitcoin, Dogecoin, Ethereum, Ethereum Classic, HODL, Litecoin, Password Manager, Stellar, XRP"
  },
  {
    name: "Catalog - Only apps supported by Live",
    apps,
    installed: "",
    _sortOptions: { type: "name", order: "asc" },
    _filterOptions: { type: "supported", installedApps: [] },
    expectedApps: "Bitcoin, Dogecoin, Ethereum"
  },
  {
    name: "Installed - Filtering outdated apps only",
    apps,
    installed: "Bitcoin (outdated), Dogecoin (outdated), XRP",
    _sortOptions: { type: "name", order: "asc" },
    _filterOptions: { type: "updatable", installedApps: [] },
    expectedApps: "Bitcoin, Dogecoin"
  },

  {
    name: "Installed - Marketcap sorting asc, no filters",
    apps,
    installed: "Bitcoin, Stellar, Ethereum",
    _sortOptions: { type: "marketcap", order: "asc" },
    _filterOptions: { type: "installed", installedApps: [] },
    expectedApps: "Stellar, Ethereum, Bitcoin"
  },
  {
    name: "Installed - Search query, no matches",
    apps,
    installed: "Bitcoin, Stellar, Ethereum",
    _sortOptions: {},
    _filterOptions: {
      query: "IMNOTHERE",
      type: "installed",
      installedApps: []
    },
    expectedApps: ""
  },
  {
    name: "Not Installed - Search query 'ethereum'",
    apps,
    installed: "Bitcoin",
    _sortOptions: { type: "name", order: "asc" },
    _filterOptions: {
      query: "ethereum",
      type: "not_installed",
      installedApps: []
    },
    expectedApps: "Ethereum, Ethereum Classic"
  }
];

scenarios.forEach(scenario => {
  test("Scenario: " + scenario.name, async () => {
    let { apps, installed: installedApps } = initState(
      mockListAppsResult(scenario.apps, scenario.installed, deviceInfo155)
    );

    const sortedFilteredApps = sortFilterApps(
      apps,
      { ...scenario._filterOptions, installedApps },
      scenario._sortOptions
    );

    expect(sortedFilteredApps.map(app => app.name)).toEqual(
      scenario.expectedApps ? scenario.expectedApps.split(", ") : []
    );
  });
});
