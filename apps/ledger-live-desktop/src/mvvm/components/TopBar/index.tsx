import React from "react";
import useTopBarViewModel from "./hooks/useTopBarViewModel";
import TopBarView from "./TopBarView";

const TopBar = () => {
  const { topBarSlots, inManager } = useTopBarViewModel();

  return <TopBarView slots={topBarSlots} shouldShowFirmwareUpdateBanner={!inManager} />;
};
export default TopBar;
