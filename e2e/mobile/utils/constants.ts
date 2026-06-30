import type { PartialFeatures } from "@shared/feature-flags";
import { parseExtraFeatureFlags } from "@ledgerhq/live-common/e2e/featureFlagsJsonUtils";

export const NANO_APP_CATALOG_PATH = "artifacts/appVersion/nano-app-catalog.json";

export const isAssetSectionEnabled = process.env.E2E_ENABLE_ASSET_SECTION !== "0";
export const isOperationsListEnabled = process.env.E2E_ENABLE_OPERATIONS_LIST !== "0";
export const isMyWalletEnabled = process.env.E2E_ENABLE_MY_WALLET !== "0";

const lwmWallet40BaseParams = {
  marketBanner: true,
  graphRework: true,
  mainNavigation: true,
  quickActionCtas: true,
  tour: false,
  balanceRefreshRework: true,
  lazyOnboarding: true,
  brazePlacement: true,
} as const;

export const FF_LWM_WALLET_40_Q1 = {
  lwmWallet40: {
    enabled: true,
    params: {
      ...lwmWallet40BaseParams,
      assetSection: false,
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

export const WALLET_40_FEATURE_FLAGS = FF_LWM_WALLET_40_Q1;

export const FF_LWM_WALLET_40_Q2 = {
  lwmWallet40: {
    enabled: true,
    params: {
      ...lwmWallet40BaseParams,
      assetSection: isAssetSectionEnabled,
      operationsList: isOperationsListEnabled,
      aggregatedAssets: true,
      myWallet: isMyWalletEnabled,
      pnl: true,
      earnUpselling: true,
      earnSimulator: true,
      assetDiscoverability: true,
      q2Tour: false,
    },
  },
} satisfies PartialFeatures;

export const getMergedFeatureFlags = ({
  testFlags,
}: { testFlags?: PartialFeatures } = {}): PartialFeatures => {
  const defaultFlags: PartialFeatures = {
    llmModularDrawer: {
      enabled: true,
      params: {
        add_account: true,
        live_app: true,
        receive_flow: false,
        send_flow: false,
        enableModularization: true,
        searchDebounceTime: 300,
        backendEnvironment: "PROD",
        live_apps_allowlist: [],
        live_apps_blocklist: [],
      },
    },
  };

  const jsonOverrideFlags = parseExtraFeatureFlags<PartialFeatures>(
    process.env.E2E_FEATURE_FLAGS_JSON,
  );

  return {
    // return with spread so that duplicate keys are overridden (last one wins)
    ...defaultFlags,
    ...FF_LWM_WALLET_40_Q2,
    ...jsonOverrideFlags,
    ...testFlags,
  };
};
