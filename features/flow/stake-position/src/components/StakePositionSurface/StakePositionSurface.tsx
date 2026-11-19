import React from "react";
import type { StakePositionSurfaceProps } from "./StakePositionSurface.types";
import { StakePositionSurfaceView } from "./StakePositionSurfaceView";
import { useStakePositionSurfaceViewModel } from "./useStakePositionSurfaceViewModel";

export function StakePositionSurface(props: StakePositionSurfaceProps) {
  return <StakePositionSurfaceView {...useStakePositionSurfaceViewModel(props)} />;
}
