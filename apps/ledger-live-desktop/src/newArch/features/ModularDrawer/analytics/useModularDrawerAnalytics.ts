import { useCallback } from "react";
import { track } from "~/renderer/analytics/segment";
import { ModularDrawerEventName, ModularDrawerEventParams } from "./modularDrawer.types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { formatAssetsConfig, formatNetworksConfig } from "./utils";
import { useSelector } from "react-redux";
import {
  modularDrawerFlowSelector,
  modularDrawerSourceSelector,
} from "~/renderer/reducers/modularDrawer";

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
  const flow = useSelector(modularDrawerFlowSelector);
  const source = useSelector(modularDrawerSourceSelector);

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
        flow,
        source,
      };
      track(eventName, analyticsParams);
    },
    [flow, source],
  );

  return { trackModularDrawerEvent };
};
