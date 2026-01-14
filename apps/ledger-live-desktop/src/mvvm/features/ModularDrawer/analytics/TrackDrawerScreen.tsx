import React, { useMemo } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { ModularDrawerEventName } from "./modularDrawer.types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { formatAssetsConfig, formatNetworksConfig } from "./utils";
import { useSelector } from "LLD/hooks/redux";
import {
  modularDrawerFlowSelector,
  modularDrawerSourceSelector,
} from "~/renderer/reducers/modularDrawer";

interface TrackDrawerScreenProps<T extends ModularDrawerEventName> {
  page: T;
  formatNetworkConfig?: boolean;
  formatAssetConfig?: boolean;
  assetsConfig?: EnhancedModularDrawerConfiguration["assets"];
  networksConfig?: EnhancedModularDrawerConfiguration["networks"];
}

const TrackDrawerScreen = <T extends ModularDrawerEventName>({
  page,
  formatNetworkConfig,
  formatAssetConfig,
  assetsConfig,
  networksConfig,
}: TrackDrawerScreenProps<T>) => {
  const source = useSelector(modularDrawerSourceSelector);
  const flow = useSelector(modularDrawerFlowSelector);

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

  return <TrackPage category={page} {...analyticsParams} />;
};

export default React.memo(TrackDrawerScreen);
