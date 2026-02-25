import React from "react";
import useTopBarViewModel from "./hooks/useTopBarViewModel";
import TopBarView from "./TopBarView";

const TopBar = () => {
  const { topBarSlots } = useTopBarViewModel();

  return <TopBarView slots={topBarSlots} />;
};
export default TopBar;
