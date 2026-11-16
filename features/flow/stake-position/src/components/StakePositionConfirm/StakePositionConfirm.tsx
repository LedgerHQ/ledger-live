import React from "react";
import type { StakePositionConfirmProps } from "./StakePositionConfirm.types";
import { StakePositionConfirmView } from "./StakePositionConfirmView";
import { useStakePositionConfirmViewModel } from "./useStakePositionConfirmViewModel";

export function StakePositionConfirm(props: StakePositionConfirmProps) {
  return <StakePositionConfirmView {...useStakePositionConfirmViewModel(props)} />;
}
