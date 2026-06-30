import { parseExtraFeatureFlags } from "@ledgerhq/live-common/e2e/featureFlagsJsonUtils";
import { Page } from "@playwright/test";

import type { OptionalFeatureMap } from "@shared/feature-flags";

export const useLocalEarnManifest = process.env.USE_LOCAL_EARN_MANIFEST === "1";

export const FF_LWD_WALLET_40_Q1 = {
  lwdWallet40: {
    enabled: true,
    params: {
      graphRework: true,
      mainNavigation: true,
      newReceiveDialog: true,
      balanceRefreshRework: true,
      lazyOnboarding: true,
      assetSection: false,
      brazePlacement: true,
      operationsList: false,
      aggregatedAssets: false,
      myWallet: false,
      pnl: false,
      earnUpselling: false,
      earnSimulator: false,
      finishOnboardingWidget: false,
      assetDiscoverability: false,
      q2tour: false,
    },
  },
} satisfies OptionalFeatureMap;

export const FF_LWD_WALLET_40_Q2 = {
  lwdWallet40: {
    enabled: true,
    params: {
      graphRework: true,
      mainNavigation: true,
      newReceiveDialog: true,
      balanceRefreshRework: true,
      lazyOnboarding: true,
      assetSection: true,
      brazePlacement: true,
      operationsList: true,
      aggregatedAssets: true,
      myWallet: true,
      pnl: true,
      earnUpselling: true,
      earnSimulator: true,
      finishOnboardingWidget: true,
      assetDiscoverability: true,
    },
  },
} satisfies OptionalFeatureMap;

// Wallet 4.0 Q2 flags with the analytics consent dialog forced OFF, so the
// "Help us improve Ledger" prompt never interrupts portfolio-landing E2E flows.
export const FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT = {
  ...FF_LWD_WALLET_40_Q2,
  analyticsOptIn: { enabled: false },
} satisfies OptionalFeatureMap;

export const FF_EARN_V2_DESKTOP = {
  ...(useLocalEarnManifest && {
    ptxEarnLiveApp: { enabled: true, params: { manifest_id: "earn-local-manifest" } },
  }),
  ptxEarnUi: { enabled: true, params: { value: "v2" } },
} satisfies OptionalFeatureMap;

export const FF_STAKE_PROGRAMS_MODAL = {
  stakePrograms: {
    enabled: true,
    params: {
      list: ["cosmos", "sei_evm"],
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
} satisfies OptionalFeatureMap;

export const FF_NEW_SEND_FLOW_DISABLED = {
  newSendFlow: {
    enabled: false,
    params: {
      families: [],
      excludedCurrencyIds: [],
    },
  },
} satisfies OptionalFeatureMap;

export const getFeatureFlags = async (page: Page): Promise<OptionalFeatureMap> => {
  const featureFlags = await page.evaluate(() => {
    return window.getAllFeatureFlags("en");
  });
  return featureFlags;
};

export const getMergedFeatureFlags = ({
  testFlags,
}: { testFlags?: OptionalFeatureMap } = {}): OptionalFeatureMap => {
  const ffEnvMapping: Record<string, OptionalFeatureMap> = {
    // the keys here are the values of the `E2E_DESKTOP_FEATURE_FLAGS` environment variable
    // we can add more mappings here in the future to test different feature flag combinations.
    // for the GitHub Actions workflow we can add options and leave the input variable name as is.
    // this will reduce friction and provide CI stability for any callers of the workflow.
    "wallet40-q1": FF_LWD_WALLET_40_Q1,
    "wallet40-q2": FF_LWD_WALLET_40_Q2,
  };

  const defaultFlags: OptionalFeatureMap = {
    // explicit defaults
    lldModularDrawer: {
      enabled: true,
      params: {
        add_account: true,
        earn_flow: true,
        live_app: true,
        receive_flow: false,
        send_flow: false,
        enableModularization: true,
        enableDialogDesktop: true,
        searchDebounceTime: 300,
        backendEnvironment: "PROD",
        live_apps_allowlist: [],
        live_apps_blocklist: [],
      },
    },
    // default flags for wallet 4.0
    ...FF_LWD_WALLET_40_Q1,
    // any flags from environment variable if set
    ...ffEnvMapping[process.env.E2E_DESKTOP_FEATURE_FLAGS || ""],
  };

  // parse JSON override flags for any overrides
  const jsonOverrideFlags: OptionalFeatureMap = parseExtraFeatureFlags(
    process.env.E2E_FEATURE_FLAGS_JSON,
  );

  return {
    // use spread so that duplicate keys are overridden (last one wins)
    ...defaultFlags,
    ...jsonOverrideFlags,
    ...testFlags,
  };
};

export const isAssetSectionEnabled = async (page: Page): Promise<boolean> => {
  const flags = await getFeatureFlags(page);
  const params = flags.lwdWallet40?.params as { assetSection?: boolean } | undefined;
  return Boolean(params?.assetSection);
};
