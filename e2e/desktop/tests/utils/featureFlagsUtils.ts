import { OptionalFeatureMap } from "@ledgerhq/types-live";

export const defaultFeatureFlags: OptionalFeatureMap = {
  lldModularDrawer: {
    enabled: false,
    params: {
      add_account: true,
      earn_flow: true,
      live_app: true,
      receive_flow: true,
      send_flow: true,
    },
  },
};
