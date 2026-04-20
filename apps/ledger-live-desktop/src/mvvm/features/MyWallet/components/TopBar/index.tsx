import React from "react";
import useTopBarViewModel from "./hooks/useTopBarViewModel";
import TopBarView from "./TopBarView";

const TopBar = () => {
  const { settingsAction } = useTopBarViewModel();
  return <TopBarView settingsAction={settingsAction} />;
};

export default TopBar;
