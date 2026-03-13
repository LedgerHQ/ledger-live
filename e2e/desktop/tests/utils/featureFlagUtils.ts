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

// TODO: remove when wallet 4.0 is default
export const LWD_WALLET_40_FF_ENABLED: OptionalFeatureMap = {
  lwdWallet40: {
    enabled: true,
    params: {
      marketBanner: true,
      graphRework: true,
      quickActionCtas: true,
      mainNavigation: true,
    },
  },
};

// TODO: remove when wallet 4.0 is default
export const LWD_WALLET_40_FF_DISABLED: OptionalFeatureMap = {
  lwdWallet40: { enabled: false },
};
