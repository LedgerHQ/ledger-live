import React from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import ModularDrawerFlowManagerLocalData from "./ModularDrawerFlowManagerLocalData";
import ModularDrawerFlowManagerRemoteData from "./ModularDrawerFlowManagerRemoteData";
import { ModularDrawerFlowManagerProps } from "./types";

const ModularDrawerFlowManager = ({
  currencies,
  drawerConfiguration,
  accounts$,
  flow,
  source,
  onAssetSelected,
  onAccountSelected,
}: ModularDrawerFlowManagerProps) => {
  const featureModularDrawerBackendData = useFeature("lldModularDrawerBackendData");

  if (featureModularDrawerBackendData?.enabled) {
    return (
      <ModularDrawerFlowManagerRemoteData
        currencies={currencies}
        drawerConfiguration={drawerConfiguration}
        accounts$={accounts$}
        flow={flow}
        source={source}
        onAssetSelected={onAssetSelected}
        onAccountSelected={onAccountSelected}
      />
    );
  }
  return (
    <ModularDrawerFlowManagerLocalData
      currencies={currencies}
      drawerConfiguration={drawerConfiguration}
      accounts$={accounts$}
      flow={flow}
      source={source}
      onAssetSelected={onAssetSelected}
      onAccountSelected={onAccountSelected}
    />
  );
};

export default ModularDrawerFlowManager;
