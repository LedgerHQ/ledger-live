import type { PartialFeatures } from "@shared/feature-flags";

// Baseline feature flags applied to every Maestro session once the app
// connects to the bridge. Specs layer their own flags on top via the session
// `featureFlags` option.
export const DEFAULT_MODULAR_DRAWER_FLAGS: PartialFeatures = {
  llmModularDrawer: {
    enabled: true,
    params: {
      add_account: true,
      live_app: true,
      live_apps_allowlist: [],
      live_apps_blocklist: ["revoke-cash"],
      receive_flow: true,
      send_flow: false,
      enableModularization: true,
      searchDebounceTime: 300,
      backendEnvironment: "PROD",
    },
  },
};
