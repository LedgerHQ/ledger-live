import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-rnative";
import { MoreHorizontal } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { MoreViewProps } from "../types";

type MoreActionProps = Pick<MoreViewProps, "moreLabel" | "onMorePress">;

export function MoreAction({ moreLabel, onMorePress }: MoreActionProps) {
  return (
    <TileButton
      icon={MoreHorizontal}
      isFull
      onPress={onMorePress}
      accessibilityLabel={moreLabel}
      testID="more-tile"
    >
      {moreLabel}
    </TileButton>
  );
}
