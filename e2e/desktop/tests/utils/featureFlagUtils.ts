import { OptionalFeatureMap } from "@ledgerhq/types-live";
import { Page } from "@playwright/test";

export const getFeatureFlags = async (page: Page): Promise<OptionalFeatureMap> => {
  const featureFlags = await page.evaluate(() => {
    return window.getAllFeatureFlags("en");
  });
  return featureFlags;
};

export const isWallet40Enabled = async (page: Page): Promise<boolean> => {
  const featureFlags = await getFeatureFlags(page);
  return featureFlags.lwdWallet40?.enabled === true;
};

const lwdWallet40BaseParams = {
  marketBanner: true,
  graphRework: true,
  quickActionCtas: true,
  mainNavigation: true,
  assetSection: true,
} as const;

// TODO: remove when wallet 4.0 is default
export const LWD_WALLET_40_FF_ENABLED: OptionalFeatureMap = {
  lwdWallet40: {
    enabled: true,
    params: { ...lwdWallet40BaseParams },
  },
};

// TODO: remove when wallet 4.0 Q2 is default
export const LWD_WALLET_40_Q2_FF_ENABLED: OptionalFeatureMap = {
  lwdWallet40: {
    enabled: true,
    params: {
      ...lwdWallet40BaseParams,
      operationsList: true,
    },
  },
};

// TODO: remove when wallet 4.0 is default
export const LWD_WALLET_40_FF_DISABLED: OptionalFeatureMap = {
  lwdWallet40: { enabled: false },
};

export const useLocalEarnManifest = process.env.USE_LOCAL_EARN_MANIFEST === "1";

export const EARN_V1_DESKTOP_FLAGS: OptionalFeatureMap = {
  ptxEarnUi: { enabled: false, params: { value: "v1" } },
  ...LWD_WALLET_40_FF_DISABLED,
};

export const EARN_V2_DESKTOP_FLAGS: OptionalFeatureMap = {
  ...(useLocalEarnManifest && {
    ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-local-manifest" } },
  }),
  ptxEarnUi: { enabled: true, params: { value: "v2" } },
  ...LWD_WALLET_40_FF_ENABLED,
};
