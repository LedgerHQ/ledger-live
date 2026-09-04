import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-react";
import { MoreHorizontal } from "@ledgerhq/lumen-ui-react/symbols";
import { CardMoreSheet } from "./CardMoreSheet";
import type { CardMoreViewProps } from "./types";

export function CardMoreView({
  moreLabel,
  sheetTitle,
  rows,
  isSheetOpen,
  onMorePress,
  onSheetClose,
}: CardMoreViewProps) {
  return (
    <>
      <TileButton
        icon={MoreHorizontal}
        isFull
        onClick={onMorePress}
        aria-label={moreLabel}
        data-testid="card-more-tile"
      >
        {moreLabel}
      </TileButton>

      <CardMoreSheet isOpen={isSheetOpen} title={sheetTitle} rows={rows} onClose={onSheetClose} />
    </>
  );
}
