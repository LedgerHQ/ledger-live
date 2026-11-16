import React from "react";
import { StakePositionRequestSheet } from "../StakePositionRequestSheet";
import type { StakePositionSheetRootViewModel } from "./useStakePositionSheetRootViewModel";

export function StakePositionSheetRootView({ request, isOpen }: StakePositionSheetRootViewModel) {
  return request ? (
    <StakePositionRequestSheet key={request.id} request={request} isOpen={isOpen} />
  ) : null;
}
