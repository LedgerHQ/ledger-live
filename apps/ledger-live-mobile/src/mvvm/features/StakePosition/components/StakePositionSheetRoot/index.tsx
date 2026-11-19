import React from "react";
import { StakePositionSheetRootView } from "./StakePositionSheetRootView";
import { useStakePositionSheetRootViewModel } from "./useStakePositionSheetRootViewModel";

/** The stake position a live app or a wallet screen asks for, in the one sheet of the app. */
export function StakePositionSheetRoot() {
  return <StakePositionSheetRootView {...useStakePositionSheetRootViewModel()} />;
}
