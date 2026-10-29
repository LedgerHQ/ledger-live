import React from "react";
import useTopBarViewModel from "./hooks/useTopBarViewModel";
import TopBarView from "./TopBarView";

const TopBar = () => {
  const {
    topBarSlots,
    inManager,
    isInformationCenterOpen,
    onInformationCenterClose,
    shouldDisplayAssetDiscoverability,
  } = useTopBarViewModel();

  return (
    <TopBarView
      slots={topBarSlots}
      shouldShowFirmwareUpdateBanner={!inManager}
      isInformationCenterOpen={isInformationCenterOpen}
      onInformationCenterClose={onInformationCenterClose}
      shouldDisplayAssetDiscoverability={shouldDisplayAssetDiscoverability}
    />
  );
};
export default TopBar;
