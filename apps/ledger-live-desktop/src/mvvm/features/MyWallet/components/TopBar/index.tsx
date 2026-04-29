import React from "react";
import useTopBarViewModel from "./hooks/useTopBarViewModel";
import TopBarView from "./TopBarView";

const TopBar = () => {
  const { title, settingsAction, notificationAction } = useTopBarViewModel();
  return (
    <TopBarView
      title={title}
      settingsAction={settingsAction}
      notificationAction={notificationAction}
    />
  );
};

export default TopBar;
