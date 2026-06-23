export const NANO_APP_CATALOG_PATH = "artifacts/appVersion/nano-app-catalog.json";

// Shared Wallet 4.0 feature flags for e2e specs — remove when Wallet 4.0 is default
export const WALLET_40_FEATURE_FLAGS = {
  lwmWallet40: {
    enabled: true,
    params: {
      marketBanner: true,
      graphRework: true,
      quickActionCtas: true,
      mainNavigation: true,
      tour: true,
      lazyOnboarding: true,
      balanceRefreshRework: true,
      assetSection: true,
      operationsList: true,
      aggregatedAssets: false,
      myWallet: true,
      pnl: false,
      assetDiscoverability: false,
    },
  },
} as const;
