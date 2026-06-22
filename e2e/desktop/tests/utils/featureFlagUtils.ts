import type { OptionalFeatureMap } from "@shared/feature-flags";
import { Page } from "@playwright/test";

export const getFeatureFlags = async (page: Page): Promise<OptionalFeatureMap> => {
  const featureFlags = await page.evaluate(() => {
    return window.getAllFeatureFlags("en");
  });
  return featureFlags;
};

export const isAssetSectionEnabled = process.env.E2E_ENABLE_ASSET_SECTION !== "0";
export const isMyWalletEnabled = process.env.E2E_ENABLE_MY_WALLET !== "0";
export const isOperationsListEnabled = process.env.E2E_ENABLE_OPERATIONS_LIST !== "0";

const lwdWallet40BaseParams = {
  marketBanner: true,
  graphRework: true,
  quickActionCtas: true,
  mainNavigation: true,
} as const;

// The Wallet 4.0 Q2 params (Asset Section, My Wallet, operations History page, aggregated assets, PnL)
// are ON by default for all desktop E2E tests, matching the upcoming production default.
// Force a given param OFF (its legacy variant) via the matching E2E_ENABLE_* env var (used by CI):
// - E2E_ENABLE_ASSET_SECTION=0  -> assetSection OFF
// - E2E_ENABLE_MY_WALLET=0      -> myWallet OFF (Settings/Notifications/My Ledger stay in the topbar)
// - E2E_ENABLE_OPERATIONS_LIST=0 -> operationsList OFF (legacy operation list on the portfolio)
export const LWD_WALLET_40_FF_ENABLED: OptionalFeatureMap = {
  lwdWallet40: {
    enabled: true,
    params: {
      ...lwdWallet40BaseParams,
      assetSection: isAssetSectionEnabled,
      myWallet: isMyWalletEnabled,
      operationsList: isOperationsListEnabled,
    },
  },
};

// TODO: remove when wallet 4.0 Q2 is default
export const LWD_WALLET_40_Q2_FF_ENABLED: OptionalFeatureMap = {
  lwdWallet40: {
    enabled: true,
    params: {
      ...lwdWallet40BaseParams,
      assetSection: true,
      operationsList: true,
      myWallet: true,
      aggregatedAssets: true,
      assetDiscoverability: true,
      pnl: true,
    },
  },
};

// Wallet 4.0 Q2 flags with the analytics consent dialog forced OFF, so the
// "Help us improve Ledger" prompt never interrupts portfolio-landing E2E flows.
export const LWD_WALLET_40_Q2_FF_ENABLED_NO_ANALYTICS_CONSENT: OptionalFeatureMap = {
  ...LWD_WALLET_40_Q2_FF_ENABLED,
  analyticsOptIn: { enabled: false },
};

export const useLocalEarnManifest = process.env.USE_LOCAL_EARN_MANIFEST === "1";

export const EARN_V2_DESKTOP_FLAGS: OptionalFeatureMap = {
  ...(useLocalEarnManifest && {
    ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-local-manifest" } },
  }),
  ptxEarnUi: { enabled: true, params: { value: "v2" } },
};

export const FF_STAKE_PROGRAMS_MODAL: OptionalFeatureMap = {
  stakePrograms: {
    enabled: true,
    params: {
      list: ["cosmos"],
      redirects: {
        "ethereum/erc20/usd__coin": {
          platform: "earn",
          name: "Earn - Deposit",
          queryParams: {
            cryptoAssetId: "ethereum/erc20/usd__coin",
            intent: "deposit",
            deposit: "stablecoin",
          },
        },
        ethereum: {
          platform: "earn",
          name: "Earn - Deposit",
          queryParams: {
            cryptoAssetId: "ethereum",
            intent: "deposit",
            ethDepositCohort: "basic_sorting",
          },
        },
      },
    },
  },
};
