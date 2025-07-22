import React, { useMemo } from "react";
import { TrackScreen } from "~/analytics";
import { ModularDrawerEventParams, ModularDrawerEventName } from "./modularDrawer.types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { formatAssetsConfig, formatNetworksConfig } from "./utils";

interface TrackDrawerScreenProps<T extends ModularDrawerEventName> {
  page: T;
  source: ModularDrawerEventParams[T]["source"];
  flow: ModularDrawerEventParams[T]["flow"];
  formatNetworkConfig?: boolean;
  formatAssetConfig?: boolean;
  assetsConfig?: EnhancedModularDrawerConfiguration["assets"];
  networksConfig?: EnhancedModularDrawerConfiguration["networks"];
}

const TrackDrawerScreen = <T extends ModularDrawerEventName>({
  page,
  source,
  flow,
  formatNetworkConfig,
  formatAssetConfig,
  assetsConfig,
  networksConfig,
}: TrackDrawerScreenProps<T>) => {
  const analyticsParams = useMemo(() => {
    return {
      source,
      flow,
      ...(formatAssetConfig && { asset_component_features: formatAssetsConfig(assetsConfig) }),
      ...(formatNetworkConfig && {
        network_component_features: formatNetworksConfig(networksConfig),
      }),
    };
  }, [source, flow, formatAssetConfig, assetsConfig, formatNetworkConfig, networksConfig]);

  return <TrackScreen category={page} {...analyticsParams} />;
};

export default React.memo(TrackDrawerScreen);
