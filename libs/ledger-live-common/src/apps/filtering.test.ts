import { initState } from "./logic";
import { deviceInfo155, mockListAppsResult } from "./mock";
import type { FilterOptions, SortOptions } from "./filtering";
import { sortFilterApps } from "./filtering";
import { setSupportedCurrencies } from "../currencies/index";
import { setPlatformVersion } from "../platform/version";
import { PLATFORM_VERSION } from "../platform/constants";
import { WALLET_API_VERSION } from "../wallet-api/constants";
import { setWalletAPIVersion } from "../wallet-api/version";

setPlatformVersion(PLATFORM_VERSION);
setWalletAPIVersion(WALLET_API_VERSION);

type FilteringScenario = {
  name: string;
  apps: string;
  installed: string;
  expectedApps: string;
  _sortOptions: SortOptions;
  _filterOptions: FilterOptions;
};
setSupportedCurrencies([
  "ethereum",
  "bitcoin",
  "dogecoin",
  "ethereum_classic",
  "ripple",
  "litecoin",
]);
const apps =
  "Bitcoin, Ethereum, Litecoin, Dogecoin, HODL, Password Manager, Ethereum Classic, XRP, Stellar ";
const scenarios: FilteringScenario[] = [
  {
    name: "Catalog - Default sorting, no filters",
    apps,
    installed: "",
    _sortOptions: {
      type: "default",
      order: "asc",
    },
    _filterOptions: {
      installedApps: [],
      type: [],
    },
    expectedApps:
      "Bitcoin, Ethereum, Litecoin, Dogecoin, HODL, Password Manager, Ethereum Classic, XRP, Stellar",
  },
  {
    name: "Catalog - Marketcap sorting, desc",
    apps,
    installed: "",
    _sortOptions: {
      type: "marketcap",
      order: "desc",
    },
    _filterOptions: {
      installedApps: [],
      type: [],
    },
    expectedApps:
      "Bitcoin, Ethereum, XRP, Litecoin, Stellar, Ethereum Classic, Dogecoin, Password Manager, HODL",
  },
  {
    name: "Catalog - Marketcap sorting, asc",
    apps,
    installed: "",
    _sortOptions: {
      type: "marketcap",
      order: "asc",
    },
    _filterOptions: {
      installedApps: [],
      type: [],
    },
    expectedApps:
      "Dogecoin, Ethereum Classic, Stellar, Litecoin, XRP, Ethereum, Bitcoin, HODL, Password Manager",
  },
  {
    name: "Catalog - Name sorting, desc",
    apps,
    installed: "",
    _sortOptions: {
      type: "name",
      order: "desc",
    },
    _filterOptions: {
      installedApps: [],
      type: [],
    },
    expectedApps:
      "XRP, Stellar, Password Manager, Litecoin, HODL, Ethereum Classic, Ethereum, Dogecoin, Bitcoin",
  },
  {
    name: "Catalog - Name sorting, asc",
    apps,
    installed: "",
    _sortOptions: {
      type: "name",
      order: "asc",
    },
    _filterOptions: {
      installedApps: [],
      type: [],
    },
    expectedApps:
      "Bitcoin, Dogecoin, Ethereum, Ethereum Classic, HODL, Litecoin, Password Manager, Stellar, XRP",
  },
  {
    name: "Catalog - Only apps supported by Live",
    apps,
    installed: "",
    _sortOptions: {
      type: "name",
      order: "asc",
    },
    _filterOptions: {
      type: ["supported"],
      installedApps: [],
    },
    expectedApps:
      "Bitcoin, Dogecoin, Ethereum, Ethereum Classic, Litecoin, XRP",
  },
  {
    name: "Catalog - Only apps not supported by Live",
    apps,
    installed: "",
    _sortOptions: {
      type: "name",
      order: "asc",
    },
    _filterOptions: {
      type: ["not_supported"],
      installedApps: [],
    },
    expectedApps: "HODL, Password Manager, Stellar",
  },
  {
    name: "Installed - Filtering outdated apps only",
    apps,
    installed: "Bitcoin (outdated), Dogecoin (outdated), XRP",
    _sortOptions: {
      type: "name",
      order: "asc",
    },
    _filterOptions: {
      type: ["updatable"],
      installedApps: [],
    },
    expectedApps: "Bitcoin, Dogecoin",
  },
  {
    name: "Installed - Only not supported by live",
    apps,
    installed: "Bitcoin, Dogecoin, XRP, Stellar, HODL",
    _sortOptions: {
      type: "name",
      order: "asc",
    },
    _filterOptions: {
      type: ["installed", "not_supported"],
      installedApps: [],
    },
    expectedApps: "HODL, Stellar",
  },
  {
    name: "Installed - Marketcap sorting asc, no filters",
    apps,
    installed: "Bitcoin, Stellar, Ethereum",
    _sortOptions: {
      type: "marketcap",
      order: "asc",
    },
    _filterOptions: {
      type: ["installed"],
      installedApps: [],
    },
    expectedApps: "Stellar, Ethereum, Bitcoin",
  },
  {
    name: "Installed - Search query, no matches",
    apps,
    installed: "Bitcoin, Stellar, Ethereum",
    _sortOptions: {},
    _filterOptions: {
      query: "IMNOTHERE",
      type: ["installed"],
      installedApps: [],
    },
    expectedApps: "",
  },
  {
    name: "Installed - With install queue param no sort",
    apps,
    installed: "Bitcoin, Stellar, Ethereum",
    _sortOptions: {},
    _filterOptions: {
      type: ["installed"],
      installQueue: ["XRP", "Dogecoin"],
      installedApps: [],
    },
    expectedApps: "XRP, Stellar, Ethereum, Dogecoin, Bitcoin",
  },
  {
    name: "Not Installed - Search query 'ethereum'",
    apps,
    installed: "Bitcoin",
    _sortOptions: {
      type: "name",
      order: "asc",
    },
    _filterOptions: {
      query: "ethereum",
      type: ["not_installed"],
      installedApps: [],
    },
    expectedApps: "Ethereum, Ethereum Classic",
  },
  {
    name: "Compatible compound filters - Installed and also supported by live",
    apps,
    installed: "Bitcoin, Ethereum, HODL",
    _sortOptions: {
      type: "name",
      order: "asc",
    },
    _filterOptions: {
      query: "",
      type: ["installed", "supported"],
      installedApps: [],
    },
    expectedApps: "Bitcoin, Ethereum",
  },
  {
    name: "Incompatible compound filters - Installed but also not installed",
    apps,
    installed: "Bitcoin, Ethereum",
    _sortOptions: {
      type: "name",
      order: "asc",
    },
    _filterOptions: {
      query: "",
      type: ["not_installed", "installed"],
      installedApps: [],
    },
    expectedApps: "",
  },
];
scenarios.forEach((scenario) => {
  test("Scenario: " + scenario.name, async () => {
    const { apps, installed: installedApps } = initState(
      mockListAppsResult(scenario.apps, scenario.installed, deviceInfo155)
    );
    const sortedFilteredApps = sortFilterApps(
      apps,
      { ...scenario._filterOptions, installedApps },
      scenario._sortOptions
    );
    expect(sortedFilteredApps.map((app) => app.name)).toEqual(
      scenario.expectedApps ? scenario.expectedApps.split(", ") : []
    );
  });
});
