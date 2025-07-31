import { ModularDrawerLocation } from "LLD/features/ModularDrawer";
import { FeatureId } from "@ledgerhq/types-live";

export const MODULAR_DRAWER_FEATURE_FLAGS: FeatureId[] = [
  "lldModularDrawer",
  "lldModularDrawerBackendData",
];

export const ENTRY_POINTS: { value: ModularDrawerLocation; label: string }[] = [
  {
    value: ModularDrawerLocation.ADD_ACCOUNT,
    label: "Add Account",
  },
  {
    value: ModularDrawerLocation.LIVE_APP,
    label: "Live App",
  },
];

export const DRAWER_CONFIG_OPTIONS = {
  assets: {
    left: [
      { value: "undefined", label: "Undefined" },
      { value: "apy", label: "Apy" },
      { value: "priceVariation", label: "Price Variation" },
    ],
    right: [
      { value: "undefined", label: "Undefined" },
      { value: "balance", label: "Balance" },
      { value: "marketTrend", label: "Market Trend" },
    ],
  },
  networks: {
    left: [
      { value: "undefined", label: "Undefined" },
      { value: "numberOfAccounts", label: "Number Of Accounts" },
      { value: "numberOfAccountsAndApy", label: "Number Of Accounts And APY" },
    ],
    right: [
      { value: "undefined", label: "Undefined" },
      { value: "balance", label: "Balance" },
    ],
  },
} as const;

export const DEFAULT_CONFIG = {
  assetsLeft: DRAWER_CONFIG_OPTIONS.assets.left[0],
  assetsRight: DRAWER_CONFIG_OPTIONS.assets.right[1],
  networksLeft: DRAWER_CONFIG_OPTIONS.networks.left[1],
  networksRight: DRAWER_CONFIG_OPTIONS.networks.right[1],
} as const;
