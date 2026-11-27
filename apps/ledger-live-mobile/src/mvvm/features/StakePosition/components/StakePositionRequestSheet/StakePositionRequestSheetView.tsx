import React from "react";
import type { StakePositionRequestSheetViewModel } from "./useStakePositionRequestSheetViewModel";

export function StakePositionRequestSheetView({
  Sheet,
  account,
  ...sheetProps
}: StakePositionRequestSheetViewModel) {
  return Sheet && account ? <Sheet account={account} {...sheetProps} /> : null;
}
