import { useCallback } from "react";
import { track } from "~/analytics/segment";
import { ModularDrawerEventName, ModularDrawerEventParams } from "./modularDrawer.types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { formatAssetsConfig, formatNetworksConfig } from "./utils";

type DrawerConfig = {
  formatNetworkConfig?: boolean;
  formatAssetConfig?: boolean;
  assetsConfig?: EnhancedModularDrawerConfiguration["assets"];
  networksConfig?: EnhancedModularDrawerConfiguration["networks"];
};

type TrackModularDrawerEvent = <T extends ModularDrawerEventName>(
  eventName: T,
  params: ModularDrawerEventParams[T],
  drawerConfig?: DrawerConfig,
) => void;

export const useModularDrawerAnalytics = () => {
  const trackModularDrawerEvent = useCallback<TrackModularDrawerEvent>(
    (eventName, params, drawerConfig) => {
      const { formatNetworkConfig, formatAssetConfig, assetsConfig, networksConfig } =
        drawerConfig || {};
      const analyticsParams = {
        ...params,
        ...(formatAssetConfig && { asset_component_features: formatAssetsConfig(assetsConfig) }),
        ...(formatNetworkConfig && {
          network_component_features: formatNetworksConfig(networksConfig),
        }),
      };

      track(eventName, analyticsParams);
    },
    [],
  );

  return { trackModularDrawerEvent };
};
