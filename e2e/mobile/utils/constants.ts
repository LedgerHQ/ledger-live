import type { PartialFeatures } from "@shared/feature-flags";

export const NANO_APP_CATALOG_PATH = "artifacts/appVersion/nano-app-catalog.json";

// Production stakePrograms config — ETH uses earn deposit screen with basic_sorting cohort
export const EARN_V2_STAKE_PROGRAMS: PartialFeatures = {
  stakePrograms: {
    enabled: true,
    params: {
      list: ["ethereum", "solana", "tezos", "cosmos", "near"],
      redirects: {
        "ethereum/erc20/usd_tether__erc20_": {
          platform: "earn",
          name: "Earn - Deposit",
          queryParams: {
            cryptoAssetId: "ethereum/erc20/usd_tether__erc20_",
            intent: "deposit",
            deposit: "stablecoin",
          },
        },
        ethereum: {
          platform: "earn",
          name: "Earn - Deposit",
          queryParams: {
            ethDepositCohort: "basic_sorting",
            cryptoAssetId: "ethereum",
            intent: "deposit",
          },
        },
      },
    },
  },
};

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
