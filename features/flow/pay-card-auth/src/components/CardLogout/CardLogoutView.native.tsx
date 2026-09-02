import React from "react";
import { TileButton } from "@ledgerhq/lumen-ui-rnative";
import { MoreHorizontal } from "@ledgerhq/lumen-ui-rnative/symbols";
import { CardMoreSheet } from "../CardMore/CardMoreSheet";
import type { CardLogoutViewProps } from "./types";

export function CardLogoutView({
  moreLabel,
  sheetTitle,
  rows,
  isSheetOpen,
  onMorePress,
  onSheetClose,
}: CardLogoutViewProps) {
  return (
    <>
      {/* The design puts three tiles in a row, and `More` is the only one in scope. `isFull` gives
          the tile the full width, so no wrapper of its own is needed today. */}
      <TileButton
        icon={MoreHorizontal}
        isFull
        onPress={onMorePress}
        accessibilityLabel={moreLabel}
        testID="card-more-tile"
      >
        {moreLabel}
      </TileButton>

      <CardMoreSheet isOpen={isSheetOpen} title={sheetTitle} rows={rows} onClose={onSheetClose} />
    </>
  );
}
