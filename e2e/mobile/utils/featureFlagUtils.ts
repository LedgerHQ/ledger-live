import { parseExtraFeatureFlags } from "@ledgerhq/live-e2e-shared/featureFlagsJsonUtils";
import { getFlags } from "@e2e/bridge/server";

import type { PartialFeatures, Features } from "@shared/feature-flags";

const FF_LWM_WALLET_40_Q1 = {
  lwmWallet40: {
    enabled: true,
    params: {
      tour: false,
      lazyOnboarding: true,
      assetSection: false,
      brazePlacement: true,
      operationsList: false,
      aggregatedAssets: false,
      myWallet: false,
      pnl: false,
      earnUpselling: false,
      earnSimulator: false,
      assetDiscoverability: false,
      q2Tour: false,
    },
  },
} satisfies PartialFeatures;

export const FF_LWM_WALLET_40_Q2 = {
  lwmWallet40: {
    enabled: true,
    params: {
      tour: false,
      lazyOnboarding: true,
      assetSection: true,
      brazePlacement: true,
      operationsList: true,
      aggregatedAssets: true,
      myWallet: true,
      pnl: true,
      earnUpselling: true,
      earnSimulator: true,
      assetDiscoverability: true,
      q2Tour: false,
    },
  },
} satisfies PartialFeatures;

export const FF_BORROW_ENABLED = {
  ...FF_LWM_WALLET_40_Q2,
  ptxBorrowLiveApp: {
    enabled: true,
    params: { manifest_id: "borrow" },
  },
  largeScreenUpsell: { enabled: false },
  // Note: Prevent usage of DIE, which is not Speculos ready yet. The device-intent drawer bypasses
  // the SignTransaction screens, so it also ignores the SWAP_DISABLE_APPS_INSTALL bypass swapSetup
  // installs; leaving this to Firebase would make signing non-deterministic.
  llmWalletApiDeviceIntentSign: { enabled: false },
  lwmWallet40: {
    ...FF_LWM_WALLET_40_Q2.lwmWallet40,
    params: {
      ...FF_LWM_WALLET_40_Q2.lwmWallet40.params,
      pnl: true,
    },
  },
} satisfies PartialFeatures;

export const FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED = {
  newSendFlowFirstInteractionBanner: { enabled: true },
} satisfies PartialFeatures;

export const FF_NEW_SEND_FLOW_ENABLED = {
  newSendFlow: {
    enabled: true,
    params: {
      families: ["cosmos", "polkadot", "evm", "algorand", "solana", "tron", "stellar", "xrp"],
      excludedCurrencyIds: [],
    },
  },
  useDeviceActionSignatureSend: { enabled: true }, // Note: Prevent usage of DIE, which is not Speculos ready yet.
  ...FF_NEW_SEND_FLOW_FIRST_INTERACTION_BANNER_ENABLED,
} satisfies PartialFeatures;

// Mina staking is not in the remote stakePrograms list yet, so the account's Earn action would not
// render without this. An empty `redirects` keeps the native Ledger Live flow rather than a partner
// app.
export const FF_MINA_STAKING_ENABLED = {
  stakePrograms: {
    enabled: true,
    params: {
      list: ["mina"],
      redirects: {},
    },
  },
} satisfies PartialFeatures;

export const getMergedFeatureFlags = ({
  testFlags,
}: { testFlags?: PartialFeatures } = {}): PartialFeatures => {
  const ffPresetMap: Record<string, PartialFeatures> = {
    /*
     * The keys here are the values of the `E2E_MOBILE_FEATURE_FLAGS` environment variable.
     * We can add more mappings here in the future to test different feature flag combinations.
     * For the GitHub Actions workflow we can add options and leave the input variable name as is.
     * This will reduce friction and provide CI stability for any callers of the workflow.
     * PLEASE NOTE: non-existing keys will return 'undefined' which spreads to an empty object.
     */
    "wallet40-q1": FF_LWM_WALLET_40_Q1,
  };

  const defaultFlags: PartialFeatures = {
    // explicit defaults
    onboardingWidget: {
      enabled: true,
    },
    largeScreenUpsell: { enabled: false },
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
    ...FF_LWM_WALLET_40_Q2,
    // any flags from env variable (if set)
    ...ffPresetMap[process.env.E2E_MOBILE_FEATURE_FLAGS || ""],
  };

  // parse JSON override flags for any overrides
  const jsonOverrideFlags: PartialFeatures = parseExtraFeatureFlags<PartialFeatures>(
    process.env.E2E_FEATURE_FLAGS_JSON,
  );

  return {
    // use spread to override duplicate keys (last one wins)
    ...defaultFlags,
    ...jsonOverrideFlags,
    ...testFlags,
  };
};

const getLwmWallet40StaticFlag = (): Features["lwmWallet40"] | undefined =>
  getMergedFeatureFlags().lwmWallet40;

export const isQ2WithAggregatedAssets = (): boolean => {
  const lwmWallet40 = getLwmWallet40StaticFlag();
  return lwmWallet40?.enabled === true && lwmWallet40?.params?.aggregatedAssets === true;
};

export const isQ2WithOperationsList = (): boolean => {
  const lwmWallet40 = getLwmWallet40StaticFlag();
  return lwmWallet40?.enabled === true && lwmWallet40?.params?.operationsList === true;
};

const getLwmFlag = async (): Promise<Features["lwmWallet40"] | undefined> => {
  const flags = await getFlags();
  const parsed = parseExtraFeatureFlags<PartialFeatures>(flags);
  return parsed.lwmWallet40;
};

export const isAssetDiscoverabilityEnabled = async (): Promise<boolean> => {
  const lwmFlag = await getLwmFlag();
  return Boolean(lwmFlag?.enabled && lwmFlag?.params?.assetDiscoverability);
};

// Distinct from `assetDiscoverability`: gates the new MVVM AssetDetail (with
// coin-options) vs the legacy MarketDetail screen (see useAssetDetailNavigation).
export const isAssetSectionEnabled = async (): Promise<boolean> => {
  const lwmFlag = await getLwmFlag();
  return Boolean(lwmFlag?.enabled && lwmFlag?.params?.assetSection);
};

export const isMyWalletEnabled = async (): Promise<boolean> => {
  const lwmFlag = await getLwmFlag();
  return Boolean(lwmFlag?.enabled && lwmFlag?.params?.myWallet);
};

export const isOperationsListEnabled = async (): Promise<boolean> => {
  const lwmFlag = await getLwmFlag();
  return Boolean(lwmFlag?.enabled && lwmFlag?.params?.operationsList);
};

export const isAggregatedAssetsEnabled = async (): Promise<boolean> => {
  const lwmFlag = await getLwmFlag();
  return Boolean(lwmFlag?.enabled && lwmFlag?.params?.aggregatedAssets);
};
