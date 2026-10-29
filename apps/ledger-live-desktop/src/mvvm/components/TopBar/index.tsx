import React from "react";
import useTopBarViewModel from "./hooks/useTopBarViewModel";
import TopBarView from "./TopBarView";

const TopBar = () => {
  const { topBarSlots, inManager, isInformationCenterOpen, onInformationCenterClose } =
    useTopBarViewModel();

  return (
    <TopBarView
      slots={topBarSlots}
      shouldShowFirmwareUpdateBanner={!inManager}
      isInformationCenterOpen={isInformationCenterOpen}
      onInformationCenterClose={onInformationCenterClose}
    />
  );
};
export default TopBar;
