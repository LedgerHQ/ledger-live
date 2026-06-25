import type { OptionalFeatureMap } from "@shared/feature-flags";
import { Page } from "@playwright/test";

export const getFeatureFlags = async (
  page: Page,
): Promise<OptionalFeatureMap> => {
  const featureFlags = await page.evaluate(() => {
    return window.getAllFeatureFlags("en");
  });
  return featureFlags;
};

// Wallet 4.0 UI variants (Asset Section, My Wallet, operations History page) are detected at runtime
// from the feature flags actually injected into the running app, so a page object/spec branches on the
// same flag set the test opted into (legacy `LWD_WALLET_40_FF_ENABLED` vs `LWD_WALLET_40_Q2_FF_ENABLED`).
type LwdWallet40Params = {
  assetSection?: boolean;
  myWallet?: boolean;
  operationsList?: boolean;
};

const getLwdWallet40Params = async (page: Page): Promise<LwdWallet40Params> => {
  const featureFlags = await getFeatureFlags(page);
  return (
    (featureFlags.lwdWallet40?.params as LwdWallet40Params | undefined) ?? {}
  );
};

export const isAssetSectionEnabled = async (page: Page): Promise<boolean> =>
  Boolean((await getLwdWallet40Params(page)).assetSection);

export const isMyWalletEnabled = async (page: Page): Promise<boolean> =>
  Boolean((await getLwdWallet40Params(page)).myWallet);

export const isOperationsListEnabled = async (page: Page): Promise<boolean> =>
  Boolean((await getLwdWallet40Params(page)).operationsList);

// Wallet 4.0 `aggregatedAssets` redirects the legacy market coin route (`/market/:id`) to the
// asset detail route (`/asset/:id`). It is enabled per-spec via `LWD_WALLET_40_Q2_FF_ENABLED`, so
// page objects/specs detect it at runtime rather than from a global env flag. Use this pattern to
// assert the coin-detail URL so the assertion holds whether the flag is ON (Q2) or OFF (legacy).
export const coinDetailUrlPattern = (assetId: string): RegExp => {
  const escaped = assetId.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  return new RegExp(`/(?:market|asset)/${escaped}`);
};

const lwdWallet40BaseParams = {
  marketBanner: true,
  graphRework: true,
  quickActionCtas: true,
  mainNavigation: true,
} as const;

// Legacy Wallet 4.0 baseline injected by default for all desktop E2E tests: the Q2 UI variants
// (Asset Section, My Wallet, operations History page) are OFF. Specs that need the Q2 UI opt in
// explicitly via `featureFlags: LWD_WALLET_40_Q2_FF_ENABLED`.
export const LWD_WALLET_40_FF_ENABLED: OptionalFeatureMap = {
  lwdWallet40: {
    enabled: true,
    params: {
      ...lwdWallet40BaseParams,
      assetSection: false,
      myWallet: false,
      operationsList: false,
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
export const LWD_WALLET_40_Q2_FF_ENABLED_NO_ANALYTICS_CONSENT: OptionalFeatureMap =
  {
    ...LWD_WALLET_40_Q2_FF_ENABLED,
    analyticsOptIn: { enabled: false },
  };

export const useLocalEarnManifest = process.env.USE_LOCAL_EARN_MANIFEST === "1";

export const EARN_V2_DESKTOP_FLAGS: OptionalFeatureMap = {
  ...(useLocalEarnManifest && {
    ptxEarnLiveApp: {
      enabled: true,
      params: { manifest_id: "earn-local-manifest" },
    },
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
