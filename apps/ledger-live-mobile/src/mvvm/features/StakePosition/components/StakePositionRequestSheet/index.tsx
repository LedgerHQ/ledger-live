import React from "react";
import { StakePositionRequestSheetView } from "./StakePositionRequestSheetView";
import {
  useStakePositionRequestSheetViewModel,
  type StakePositionRequestSheetProps,
} from "./useStakePositionRequestSheetViewModel";

/** One request, rendered by its account family's sheet. Key it by the request id. */
export function StakePositionRequestSheet(props: StakePositionRequestSheetProps) {
  return <StakePositionRequestSheetView {...useStakePositionRequestSheetViewModel(props)} />;
}
