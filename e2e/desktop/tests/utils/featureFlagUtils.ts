import { parseExtraFeatureFlags } from "@ledgerhq/live-e2e-shared/featureFlagsJsonUtils";
import { Page } from "@playwright/test";

import type { OptionalFeatureMap, Features } from "@shared/feature-flags";

export const getFeatureFlags = async (page: Page): Promise<OptionalFeatureMap> => {
  const featureFlags = await page.evaluate(() => {
    return window.getAllFeatureFlags("en");
  });
  return featureFlags;
};

const getLwdWallet40Params = async (
  page: Page,
): Promise<Features["lwdWallet40"]["params"] | undefined> => {
  const featureFlags = await getFeatureFlags(page);
  const lwdWallet40 = featureFlags.lwdWallet40 as Features["lwdWallet40"];
  return lwdWallet40?.params;
};

export const isAssetSectionEnabled = async (page: Page): Promise<boolean> =>
  Boolean((await getLwdWallet40Params(page))?.assetSection);

export const isMyWalletEnabled = async (page: Page): Promise<boolean> =>
  Boolean((await getLwdWallet40Params(page))?.myWallet);

export const isOperationsListEnabled = async (page: Page): Promise<boolean> =>
  Boolean((await getLwdWallet40Params(page))?.operationsList);

export const isAggregatedAssetsEnabled = async (page: Page): Promise<boolean> =>
  Boolean((await getLwdWallet40Params(page))?.aggregatedAssets);

export const isAssetDiscoverabilityEnabled = async (page: Page): Promise<boolean> =>
  Boolean((await getLwdWallet40Params(page))?.assetDiscoverability);

export const useLocalEarnManifest = process.env.USE_LOCAL_EARN_MANIFEST === "1";

export const FF_LWD_WALLET_40_Q1 = {
  lwdWallet40: {
    enabled: true,
    params: {
      newReceiveDialog: true,
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
      q2Tour: false,
    },
  },
} satisfies OptionalFeatureMap;

export const FF_LWD_WALLET_40_Q2 = {
  lwdWallet40: {
    enabled: true,
    params: {
      newReceiveDialog: true,
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

export const FF_BORROW_DESKTOP = {
  ptxBorrowLiveApp: {
    enabled: true,
    params: { manifest_id: "borrow" },
  },
} satisfies OptionalFeatureMap;

export const FF_EARN_V2_DESKTOP = {
  ...(useLocalEarnManifest && {
    ptxEarnLiveApp: {
      enabled: true,
      params: { manifest_id: "earn-local-manifest" },
    },
  }),
  ptxEarnUi: { enabled: true, params: { value: "v2" } },
} satisfies OptionalFeatureMap;

export const FF_EARN_V2_DESKTOP_WITH_SIMULATOR = {
  ...FF_EARN_V2_DESKTOP,
  ...FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
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

export const FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED = {
  newSendFlowFirstInteractionBanner: { enabled: true },
} satisfies OptionalFeatureMap;

export const getMergedFeatureFlags = ({
  testFlags,
}: { testFlags?: OptionalFeatureMap } = {}): OptionalFeatureMap => {
  const ffPresetMap: Record<string, OptionalFeatureMap> = {
    /*
     * The keys here are the values of the `E2E_DESKTOP_FEATURE_FLAGS` environment variable.
     * We can add more mappings here in the future to test different feature flag combinations.
     * For the GitHub Actions workflow we can add options and leave the input variable name as is.
     * This will reduce friction and provide CI stability for any callers of the workflow.
     * PLEASE NOTE: non-existing keys will return 'undefined' which spreads to an empty object.
     */
    "wallet40-q1": FF_LWD_WALLET_40_Q1,
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
    ...FF_LWD_WALLET_40_Q2,
    ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
    // any flags from env variable (if set)
    ...ffPresetMap[process.env.E2E_DESKTOP_FEATURE_FLAGS || ""],
  };

  // parse JSON override flags for any overrides
  const jsonOverrideFlags: OptionalFeatureMap = parseExtraFeatureFlags(
    process.env.E2E_FEATURE_FLAGS_JSON,
  );

  return {
    // use spread to override duplicate keys (last one wins)
    ...defaultFlags,
    ...jsonOverrideFlags,
    ...testFlags,
  };
};
