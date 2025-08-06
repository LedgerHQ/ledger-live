import { OptionalFeatureMap } from "@ledgerhq/types-live";

export const getDefaultFeatureFlags = (): OptionalFeatureMap => ({
  lldNetworkBasedAddAccount: {
    enabled: false,
  },
  lldModularDrawer: {
    enabled: true,
    params: {
      add_account: true,
      earn_flow: true,
      live_app: true,
      receive_flow: true,
      send_flow: true,
      enableModularization: false,
    },
  },
});
