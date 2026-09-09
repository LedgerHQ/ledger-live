import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-rnative";
import { MoreHorizontal } from "@ledgerhq/lumen-ui-rnative/symbols";
import { MoreSheet } from "../Sheet/MoreSheet";
import type { MoreViewProps } from "../types";

export function Tile({
  moreLabel,
  sheetTitle,
  rows,
  isSheetOpen,
  onMorePress,
  onSheetClose,
}: MoreViewProps) {
  return (
    <>
      <TileButton
        icon={MoreHorizontal}
        isFull
        onPress={onMorePress}
        accessibilityLabel={moreLabel}
        testID="more-tile"
      >
        {moreLabel}
      </TileButton>

      <MoreSheet isOpen={isSheetOpen} title={sheetTitle} rows={rows} onClose={onSheetClose} />
    </>
  );
}
