import { initState } from "./logic";
import { deviceInfo155, mockListAppsResult } from "./mock";
import type { FilterOptions, SortOptions } from "./filtering";
import { sortFilterApps, isAppAssociatedCurrencySupported } from "./filtering";
import { setSupportedCurrencies } from "../currencies/index";
import { WALLET_API_VERSION } from "../wallet-api/constants";
import { setWalletAPIVersion } from "../wallet-api/version";
import { App } from "@ledgerhq/types-live";

setWalletAPIVersion(WALLET_API_VERSION);

const mockedFeatureFlags = {
  isFeature: () => false,
  getFeature: () => null,
};

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
      ...mockedFeatureFlags,
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
      ...mockedFeatureFlags,
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
      ...mockedFeatureFlags,
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
      ...mockedFeatureFlags,
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
      ...mockedFeatureFlags,
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
      ...mockedFeatureFlags,
    },
    expectedApps: "Bitcoin, Dogecoin, Ethereum, Ethereum Classic, Litecoin, XRP",
  },
  {
    name: "Catalog - Only apps supported by Live, feature flagged currencies",
    apps,
    installed: "",
    _sortOptions: {
      type: "name",
      order: "asc",
    },
    _filterOptions: {
      type: ["supported"],
      installedApps: [],
      isFeature() {
        return true;
      },
      getFeature(key: string) {
        if (key === "currencyLitecoin") return { enabled: true };
        if (key === "currencyDogecoin") return { enabled: false };
        return null;
      },
    },
    expectedApps: "Bitcoin, Ethereum, Ethereum Classic, Litecoin, XRP",
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
      ...mockedFeatureFlags,
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
      ...mockedFeatureFlags,
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
      ...mockedFeatureFlags,
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
      ...mockedFeatureFlags,
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
      ...mockedFeatureFlags,
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
      ...mockedFeatureFlags,
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
      ...mockedFeatureFlags,
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
      ...mockedFeatureFlags,
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
      ...mockedFeatureFlags,
    },
    expectedApps: "",
  },
];
scenarios.forEach(scenario => {
  test("Scenario: " + scenario.name, async () => {
    const { apps, installed: installedApps } = initState(
      mockListAppsResult(scenario.apps, scenario.installed, deviceInfo155),
    );
    const sortedFilteredApps = sortFilterApps(
      apps,
      { ...scenario._filterOptions, installedApps },
      scenario._sortOptions,
    );
    expect(sortedFilteredApps.map(app => app.name)).toEqual(
      scenario.expectedApps ? scenario.expectedApps.split(", ") : [],
    );
  });
});

type AppSupportedScenario = {
  name: string;
  expected: boolean;
  params: Parameters<typeof isAppAssociatedCurrencySupported>[0];
};

const appSupportedScenarios: Array<AppSupportedScenario> = [
  {
    name: "App is a plugin",
    expected: true,
    params: { app: { type: "plugin" } as App, ...mockedFeatureFlags },
  },
  {
    name: "App is swap",
    expected: true,
    params: { app: { type: "swap" } as App, ...mockedFeatureFlags },
  },
  {
    name: "App has no currencyId",
    expected: false,
    params: { app: {} as App, ...mockedFeatureFlags },
  },
  {
    name: "App's associated currency is not supported",
    expected: false,
    params: {
      app: { currencyId: "stellar" } as App,
      ...mockedFeatureFlags,
    },
  },
  {
    name: "App's associated currency has no feature flag",
    expected: true,
    params: {
      app: { currencyId: "bitcoin" } as App,
      ...mockedFeatureFlags,
      isFeature: () => false,
    },
  },
  {
    name: "App's associated currency has a feature flag that disables it",
    expected: false,
    params: {
      app: { currencyId: "bitcoin" } as App,
      isFeature: () => true,
      getFeature: (key: string) => {
        if (key === "currencyBitcoin") return { enabled: false };
        throw new Error("wrong featureId key generated: " + key);
      },
    },
  },
  {
    name: "App's associated currency has a feature flag that enables it",
    expected: true,
    params: {
      app: { currencyId: "bitcoin" } as App,
      isFeature: () => true,
      getFeature: (key: string) => {
        if (key === "currencyBitcoin") return { enabled: true };
        throw new Error("wrong featureId key generate: " + key);
      },
    },
  },
  {
    name: "App's associated currency has a feature flag that is null (will never happen but typewise it can happen)",
    expected: true,
    params: {
      app: { currencyId: "bitcoin" } as App,
      isFeature: () => true,
      getFeature: (key: string) => {
        if (key === "currencyBitcoin") return null;
        throw new Error("wrong featureId key generate: " + key);
      },
    },
  },
];

describe("isAppAssociatedCurrencySupported", () => {
  appSupportedScenarios.forEach(scenario => {
    test(`Scenario: ${scenario.name} (expect ${scenario.expected})`, () => {
      expect(isAppAssociatedCurrencySupported(scenario.params)).toBe(scenario.expected);
    });
  });
});
