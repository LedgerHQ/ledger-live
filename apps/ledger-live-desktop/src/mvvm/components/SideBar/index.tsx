import React from "react";
import { useSideBarViewModel } from "./useSideBarViewModel";
import { SideBarView } from "./SideBarView";

function SideBar() {
  const viewModel = useSideBarViewModel();
  return <SideBarView viewModel={viewModel} />;
}

export default SideBar;
export { useSideBarViewModel } from "./useSideBarViewModel";
export type { SideBarViewModel } from "./types";
