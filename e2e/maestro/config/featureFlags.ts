import type { PartialFeatures } from "@shared/feature-flags";

export const isWallet40 = process.env.E2E_ENABLE_WALLET40 !== "0";

export const DEFAULT_MODULAR_DRAWER_FLAGS: PartialFeatures = {
  llmModularDrawer: {
    enabled: true,
    params: {
      add_account: true,
      live_app: true,
      live_apps_allowlist: [],
      live_apps_blocklist: ["revoke-cash"],
      receive_flow: true,
      send_flow: false,
      enableModularization: true,
      searchDebounceTime: 300,
      backendEnvironment: "PROD",
    },
  },
};

export const WALLET_40_FEATURE_FLAGS: PartialFeatures = {
  lwmWallet40: {
    enabled: isWallet40,
    params: {
      mainNavigation: isWallet40,
      marketBanner: isWallet40,
      graphRework: isWallet40,
      quickActionCtas: isWallet40,
      tour: false,
      lazyOnboarding: isWallet40,
      balanceRefreshRework: isWallet40,
      assetSection: false,
      assetDiscoverability: false,
      operationsList: false,
      aggregatedAssets: false,
      myWallet: isWallet40,
      pnl: false,
    },
  },
};

export const DEFAULT_FEATURE_FLAGS: PartialFeatures = {
  ...DEFAULT_MODULAR_DRAWER_FLAGS,
  ...WALLET_40_FEATURE_FLAGS,
};
