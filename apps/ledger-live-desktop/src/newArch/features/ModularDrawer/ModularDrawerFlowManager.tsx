import React, { useEffect } from "react";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import ModularDrawerFlowManagerLocalData from "./ModularDrawerFlowManagerLocalData";
import ModularDrawerFlowManagerRemoteData from "./ModularDrawerFlowManagerRemoteData";
import { ModularDrawerFlowManagerProps } from "./types";
import { useDispatch } from "react-redux";
import { setSearchedValue } from "~/renderer/reducers/modularDrawer";

const ModularDrawerFlowManager = ({
  currencies,
  drawerConfiguration,
  useCase,
  areCurrenciesFiltered,
  accounts$,
  flow,
  source,
  onAssetSelected,
  onAccountSelected,
}: ModularDrawerFlowManagerProps) => {
  const featureModularDrawerBackendData = useFeature("lldModularDrawerBackendData");

  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      // Reset search value when the drawer closes/unmounts
      dispatch(setSearchedValue(undefined));
    };
  }, [dispatch]);

  if (featureModularDrawerBackendData?.enabled) {
    return (
      <ModularDrawerFlowManagerRemoteData
        currencies={currencies}
        drawerConfiguration={drawerConfiguration}
        accounts$={accounts$}
        flow={flow}
        source={source}
        useCase={useCase}
        areCurrenciesFiltered={areCurrenciesFiltered}
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
