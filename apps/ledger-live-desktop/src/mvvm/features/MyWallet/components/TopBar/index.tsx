import React from "react";
import useTopBarViewModel from "./hooks/useTopBarViewModel";
import TopBarView from "./TopBarView";

const TopBar = () => {
  const { settingsAction, notificationAction } = useTopBarViewModel();
  return <TopBarView settingsAction={settingsAction} notificationAction={notificationAction} />;
};

export default TopBar;
