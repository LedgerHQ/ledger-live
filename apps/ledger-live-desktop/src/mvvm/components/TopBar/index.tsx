import React from "react";
import useTopBarViewModel from "./hooks/useTopBarViewModel";
import TopBarView from "./TopBarView";

const TopBar = () => {
  const {
    topBarSlots,
    inManager,
    isInformationCenterOpen,
    onInformationCenterClose,
    shouldDisplayAggregatedAssets,
    shouldDisplayAssetDiscoverability,
  } = useTopBarViewModel();

  return (
    <TopBarView
      slots={topBarSlots}
      shouldShowFirmwareUpdateBanner={!inManager}
      isInformationCenterOpen={isInformationCenterOpen}
      onInformationCenterClose={onInformationCenterClose}
      shouldDisplayAggregatedAssets={shouldDisplayAggregatedAssets}
      shouldDisplayAssetDiscoverability={shouldDisplayAssetDiscoverability}
    />
  );
};
export default TopBar;
