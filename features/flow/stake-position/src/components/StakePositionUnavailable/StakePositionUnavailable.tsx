import React from "react";
import type { StakePositionUnavailableProps } from "./StakePositionUnavailable.types";
import { StakePositionUnavailableView } from "./StakePositionUnavailableView";
import { useStakePositionUnavailableViewModel } from "./useStakePositionUnavailableViewModel";

export function StakePositionUnavailable(props: StakePositionUnavailableProps) {
  return <StakePositionUnavailableView {...useStakePositionUnavailableViewModel(props)} />;
}
