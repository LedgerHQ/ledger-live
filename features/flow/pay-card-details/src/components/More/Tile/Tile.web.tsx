import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import { MoreHorizontal } from "@ledgerhq/lumen-ui-react/symbols";
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
        onClick={onMorePress}
        aria-label={moreLabel}
        data-testid="more-tile"
      >
        {moreLabel}
      </TileButton>

      <MoreSheet isOpen={isSheetOpen} title={sheetTitle} rows={rows} onClose={onSheetClose} />
    </>
  );
}
