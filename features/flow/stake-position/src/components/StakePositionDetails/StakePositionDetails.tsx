import React from "react";
import type { StakePositionDetailsProps } from "./StakePositionDetails.types";
import { StakePositionDetailsView } from "./StakePositionDetailsView";
import { useStakePositionDetailsViewModel } from "./useStakePositionDetailsViewModel";

export function StakePositionDetails(props: StakePositionDetailsProps) {
  return <StakePositionDetailsView {...useStakePositionDetailsViewModel(props)} />;
}
