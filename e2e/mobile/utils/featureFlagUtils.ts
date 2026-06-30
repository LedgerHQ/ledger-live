import { parseExtraFeatureFlags } from "@ledgerhq/live-common/e2e/featureFlagsJsonUtils";
import type { PartialFeatures } from "@shared/feature-flags";
import { isWallet40 } from "../helpers/commonHelpers";

const defaultFlags = {
  lwmWallet40: {
    enabled: isWallet40,
    params: {
      mainNavigation: isWallet40,
      marketBanner: isWallet40,
      graphRework: isWallet40,
      quickActionCtas: isWallet40,
      tour: false,
      lazyOnboarding: isWallet40,
      balanceRefreshRework: isWallet40,
      assetSection: false,
      operationsList: false,
      aggregatedAssets: false,
      myWallet: isWallet40,
      pnl: false,
      assetDiscoverability: false,
    },
  },
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
};

export const getMergedFeatureFlags = ({
  testFlags,
}: { testFlags?: PartialFeatures } = {}): PartialFeatures => ({
  ...defaultFlags,
  ...parseExtraFeatureFlags<PartialFeatures>(process.env.E2E_FEATURE_FLAGS_JSON),
  ...testFlags,
});
