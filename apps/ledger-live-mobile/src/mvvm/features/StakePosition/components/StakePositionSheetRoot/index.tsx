import React from "react";
import { StakePositionSheetRootView } from "./StakePositionSheetRootView";
import { useStakePositionSheetRootViewModel } from "./useStakePositionSheetRootViewModel";

/** The stake position the Earn live app asks for, shown over the Earn screen. */
export function StakePositionSheetRoot() {
  return <StakePositionSheetRootView {...useStakePositionSheetRootViewModel()} />;
}
