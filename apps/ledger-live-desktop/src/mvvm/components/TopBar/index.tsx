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
  } = useTopBarViewModel();

  return (
    <TopBarView
      slots={topBarSlots}
      shouldShowFirmwareUpdateBanner={!inManager}
      isInformationCenterOpen={isInformationCenterOpen}
      onInformationCenterClose={onInformationCenterClose}
      shouldDisplayAggregatedAssets={shouldDisplayAggregatedAssets}
    />
  );
};
export default TopBar;
