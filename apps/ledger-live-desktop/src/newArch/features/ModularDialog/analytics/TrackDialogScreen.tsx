import React, { useMemo } from "react";
import TrackPage from "~/renderer/analytics/TrackPage";
import { ModularDialogEventName } from "./modularDialog.types";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { formatAssetsConfig, formatNetworksConfig } from "./utils";
import { useSelector } from "react-redux";
import {
  modularDrawerFlowSelector,
  modularDrawerSourceSelector,
} from "~/renderer/reducers/modularDrawer";

interface TrackDialogScreenProps<T extends ModularDialogEventName> {
  page: T;
  formatNetworkConfig?: boolean;
  formatAssetConfig?: boolean;
  assetsConfig?: EnhancedModularDrawerConfiguration["assets"];
  networksConfig?: EnhancedModularDrawerConfiguration["networks"];
}

const TrackDialogScreen = <T extends ModularDialogEventName>({
  page,
  formatNetworkConfig,
  formatAssetConfig,
  assetsConfig,
  networksConfig,
}: TrackDialogScreenProps<T>) => {
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

export default React.memo(TrackDialogScreen);
