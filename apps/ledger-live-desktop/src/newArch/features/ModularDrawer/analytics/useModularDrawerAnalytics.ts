import { useCallback } from "react";
import { track } from "~/renderer/analytics/segment";
import { ModularDrawerEventName, ModularDrawerEventParams } from "./types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { formatAssetsConfig, formatNetworksConfig } from "./utils";

type TrackModularDrawerEvent = <T extends ModularDrawerEventName>(
  eventName: T,
  params: ModularDrawerEventParams[T],
  formatNetworkConfig?: boolean,
  formatAssetConfig?: boolean,
  assetsConfig?: EnhancedModularDrawerConfiguration["assets"],
  networksConfig?: EnhancedModularDrawerConfiguration["networks"],
) => void;

export const useModularDrawerAnalytics = () => {
  const trackModularDrawerEvent = useCallback<TrackModularDrawerEvent>(
    (eventName, params, formatNetworkConfig, formatAssetConfig, assetsConfig, networksConfig) => {
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
