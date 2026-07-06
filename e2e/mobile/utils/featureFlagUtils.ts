import { parseExtraFeatureFlags } from "@ledgerhq/live-e2e-shared/featureFlagsJsonUtils";
import { getFlags } from "../bridge/server";

import type { OptionalFeatureMap, Features } from "@shared/feature-flags";

export const FF_LWM_WALLET_40_Q1 = {
  lwmWallet40: {
    enabled: true,
    params: {
      graphRework: true,
      tour: false,
      lazyOnboarding: true,
      assetSection: false,
      brazePlacement: true,
      operationsList: false,
      aggregatedAssets: false,
      myWallet: false,
      earnUpselling: false,
      earnSimulator: false,
      onboardingWidget: false,
      assetDiscoverability: false,
      q2Tour: false,
    },
  },
} satisfies OptionalFeatureMap;

export const FF_LWM_WALLET_40_Q2 = {
  lwmWallet40: {
    enabled: true,
    params: {
      graphRework: true,
      tour: false,
      lazyOnboarding: true,
      assetSection: true,
      brazePlacement: true,
      operationsList: true,
      aggregatedAssets: true,
      myWallet: true,
      earnUpselling: true,
      earnSimulator: true,
      onboardingWidget: true,
      assetDiscoverability: true,
      q2Tour: false,
    },
  },
} satisfies OptionalFeatureMap;

export const getMergedFeatureFlags = ({
  testFlags,
}: { testFlags?: OptionalFeatureMap } = {}): OptionalFeatureMap => {
  const ffEnvMapping: Record<string, OptionalFeatureMap> = {
    /*
     * The keys here are the values of the `E2E_MOBILE_FEATURE_FLAGS` environment variable.
     * We can add more mappings here in the future to test different feature flag combinations.
     * For the GitHub Actions workflow we can add options and leave the input variable name as is.
     * This will reduce friction and provide CI stability for any callers of the workflow.
     * PLEASE NOTE: non-existing keys will return 'undefined' which spreads to an empty object.
     */
    "wallet40-q2": FF_LWM_WALLET_40_Q2,
  };

  const defaultFlags: OptionalFeatureMap = {
    // explicit defaults
    onboardingWidget: {
      enabled: true,
    },
    llmModularDrawer: {
      enabled: true,
      params: {
        add_account: true,
        live_app: true,
        live_apps_allowlist: [],
        live_apps_blocklist: ["revoke-cash"],
        receive_flow: false,
        send_flow: false,
        enableModularization: true,
        searchDebounceTime: 300,
        backendEnvironment: "PROD",
      },
    },
    // default flags for wallet 4.0
    ...FF_LWM_WALLET_40_Q1,
    // any flags from env variable (if set)
    ...ffEnvMapping[process.env.E2E_MOBILE_FEATURE_FLAGS || ""],
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

export const getLwmFlag = async (): Promise<Features["lwmWallet40"] | undefined> => {
  const flags = await getFlags();
  if (!flags.trim()) {
    return undefined; // avoid parse errors
  }
  return JSON.parse(flags).lwmWallet40 as Features["lwmWallet40"];
};

export const isAssetDiscoverabilityEnabled = async (): Promise<boolean> => {
  const lwmFlag = await getLwmFlag();
  return Boolean(lwmFlag?.enabled && lwmFlag?.params?.assetDiscoverability);
};

// Distinct from `assetDiscoverability`: gates the new MVVM AssetDetail (with
// coin-options) vs the legacy MarketDetail screen (see useAssetDetailNavigation).
export const isAggregatedAssetsEnabled = async (): Promise<boolean> => {
  const lwmFlag = await getLwmFlag();
  return Boolean(lwmFlag?.enabled && lwmFlag?.params?.aggregatedAssets);
};
