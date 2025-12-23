import { useCallback } from "react";
import { track } from "~/renderer/analytics/segment";
import { ModularDialogEventName, ModularDialogEventParams } from "./modularDialog.types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { formatAssetsConfig, formatNetworksConfig } from "./utils";
import { useSelector } from "LLD/hooks/redux";
import {
  modularDrawerFlowSelector,
  modularDrawerSourceSelector,
} from "~/renderer/reducers/modularDrawer";

type DialogConfig = {
  formatNetworkConfig?: boolean;
  formatAssetConfig?: boolean;
  assetsConfig?: EnhancedModularDrawerConfiguration["assets"];
  networksConfig?: EnhancedModularDrawerConfiguration["networks"];
};

type TrackModularDialogEvent = <T extends ModularDialogEventName>(
  eventName: T,
  params: ModularDialogEventParams[T],
  dialogConfig?: DialogConfig,
) => void;

export const useModularDialogAnalytics = () => {
  const flow = useSelector(modularDrawerFlowSelector);
  const source = useSelector(modularDrawerSourceSelector);

  const trackModularDialogEvent = useCallback<TrackModularDialogEvent>(
    (eventName, params, dialogConfig) => {
      const { formatNetworkConfig, formatAssetConfig, assetsConfig, networksConfig } =
        dialogConfig || {};
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

  return { trackModularDialogEvent };
};
