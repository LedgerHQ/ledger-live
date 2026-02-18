import React from "react";
import useTopBarViewModel from "./hooks/useTopBarViewModel";
import TopBarView from "./TopBarView";

const TopBar = () => {
  const { topBarActionsList } = useTopBarViewModel();

  return <TopBarView actionsList={topBarActionsList} />;
};
export default TopBar;
