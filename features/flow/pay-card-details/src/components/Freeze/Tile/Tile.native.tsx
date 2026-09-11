import React from "react";
import { FreezeAction } from "./FreezeAction";
import type { FreezeViewModel } from "../../../types";

export function Tile({ isActionDisabled, onOpenConfirm, status }: FreezeViewModel) {
  return (
    <FreezeAction
      status={status}
      isActionDisabled={isActionDisabled}
      onOpenConfirm={onOpenConfirm}
    />
  );
}
