import { OptionalFeatureMap } from "@ledgerhq/types-live";
import { Page } from "@playwright/test";

export const getFeatureFlags = async (page: Page): Promise<OptionalFeatureMap> => {
  const featureFlags = await page.evaluate(() => {
    return window.getAllFeatureFlags("en");
  });
  return featureFlags;
};

export const isAssetSectionEnabled = process.env.E2E_ENABLE_ASSET_SECTION !== "0";

const lwdWallet40BaseParams = {
  marketBanner: true,
  graphRework: true,
  quickActionCtas: true,
  mainNavigation: true,
} as const;

// The Wallet 4.0 "Asset Section" is ON by default for all desktop E2E tests.
// Force it OFF (the "assetSection OFF" test variant) by setting E2E_ENABLE_ASSET_SECTION=0 (used by CI).
export const LWD_WALLET_40_FF_ENABLED: OptionalFeatureMap = {
  lwdWallet40: {
    enabled: true,
    params: { ...lwdWallet40BaseParams, assetSection: isAssetSectionEnabled },
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
    },
  },
};

export const useLocalEarnManifest = process.env.USE_LOCAL_EARN_MANIFEST === "1";

export const EARN_V1_DESKTOP_FLAGS: OptionalFeatureMap = {
  ptxEarnUi: { enabled: false, params: { value: "v1" } },
};

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
      list: ["ethereum", "cosmos"],
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
      },
    },
  },
};
