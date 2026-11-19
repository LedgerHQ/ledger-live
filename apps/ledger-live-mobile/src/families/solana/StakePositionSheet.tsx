import React from "react";
import type { StakePositionSheetProps } from "LLM/features/StakePosition";
import { StakePositionSheetView } from "./StakePosition/StakePositionSheetView";
import { useSolanaStakePositionSheetViewModel } from "./StakePosition/useSolanaStakePositionSheetViewModel";

const StakePositionSheet = (props: StakePositionSheetProps) => (
  <StakePositionSheetView {...useSolanaStakePositionSheetViewModel(props)} />
);

export default StakePositionSheet;
