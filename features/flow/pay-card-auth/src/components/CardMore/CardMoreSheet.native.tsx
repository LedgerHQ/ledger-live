import React, { useCallback, useEffect, useRef } from "react";
import { BottomSheetHeader, BottomSheetView, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { CardMoreRow } from "./CardMoreRow";
import type { CardMoreSheetProps } from "./types";

export function CardMoreSheet({ isOpen, title, rows, onClose }: CardMoreSheetProps) {
  // gorhom reports a dismiss for the gesture and for the close button, and both can land. The only
  // caller today passes an idempotent `onClose`, so the guard is what keeps this sheet safe for a
  // caller whose `onClose` is not: `FeatureTourView.native.tsx:31` needs the same ref, and there a
  // second call really does write twice.
  const dismissed = useRef(false);

  useEffect(() => {
    if (isOpen) {
      dismissed.current = false;
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (dismissed.current) {
      return;
    }
    dismissed.current = true;
    onClose();
  }, [onClose]);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={handleClose}
      enableDynamicSizing
      testID="card-more-sheet"
    >
      {isOpen ? (
        // `BottomSheetView` ships `paddingHorizontal: s16` and `paddingBottom: s16`, and it merges a
        // passed `style` over both. The design puts the rows at 8, and a row's own padding of 8 then
        // puts its icon at 16, level with the title. The 24 here is the whole bottom inset the
        // design asks for, so nothing below it adds a second one.
        <BottomSheetView style={{ paddingHorizontal: 0, paddingBottom: 24 }}>
          {/* No `title` here: the design wants it left-aligned and larger, below the header. */}
          <BottomSheetHeader density="compact" spacing />

          {/* The 24 below the title is the whole gap to the first row. */}
          <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s24" }}>
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              {title}
            </Text>
          </Box>

          <Box
            lx={{ flexDirection: "column", marginHorizontal: "s8" }}
            testID="card-more-sheet-content"
          >
            {rows.map(row => (
              <CardMoreRow key={row.id} row={row} />
            ))}
          </Box>
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}
