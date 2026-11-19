import React from "react";
import type { StakePositionResultProps } from "./StakePositionResult.types";
import { StakePositionResultView } from "./StakePositionResultView";
import { useStakePositionResultViewModel } from "./useStakePositionResultViewModel";

export function StakePositionResult(props: StakePositionResultProps) {
  return <StakePositionResultView {...useStakePositionResultViewModel(props)} />;
}
