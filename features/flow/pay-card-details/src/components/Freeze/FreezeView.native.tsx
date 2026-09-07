import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-rnative";
import { Snow } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { FreezeViewProps } from "../../types";

export function FreezeView({
  isFrozen,
  isBlocked,
  isStatusLoading,
  isFreezeLoading,
  isUnfreezeLoading,
  onFreeze,
  onUnfreeze,
}: FreezeViewProps) {
  return (
    <TileButton
      icon={Snow}
      onPress={isFrozen ? onUnfreeze : onFreeze}
      disabled={isBlocked || isStatusLoading || isFreezeLoading || isUnfreezeLoading}
      isFull
    >
      {isFrozen ? "Unfreeze" : "Freeze"}
    </TileButton>
  );
}
