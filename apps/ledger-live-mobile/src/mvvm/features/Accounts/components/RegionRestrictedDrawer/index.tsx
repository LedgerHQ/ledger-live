import React from "react";
import { RegionRestrictedDrawerView } from "./RegionRestrictedDrawerView";
import { useRegionRestrictedDrawerViewModel } from "./useRegionRestrictedDrawerViewModel";

export function RegionRestrictedDrawer() {
  return <RegionRestrictedDrawerView {...useRegionRestrictedDrawerViewModel()} />;
}
