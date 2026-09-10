import React, { useCallback, useEffect, useRef } from "react";
import { BottomSheetHeader, BottomSheetView, Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { MoreRow } from "./MoreRow";
import type { MoreSheetProps } from "../types";

export function MoreSheet({ isOpen, title, rows, onClose }: MoreSheetProps) {
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
      testID="more-sheet"
    >
      {isOpen ? (
        <BottomSheetView style={{ paddingHorizontal: 0, paddingBottom: 24 }}>
          <BottomSheetHeader density="compact" spacing />

          <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s24" }}>
            <Text typography="heading3SemiBold" lx={{ color: "base" }}>
              {title}
            </Text>
          </Box>

          <Box lx={{ flexDirection: "column", marginHorizontal: "s8" }} testID="more-sheet-content">
            {rows.map(row => (
              <MoreRow key={row.id} row={row} />
            ))}
          </Box>
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}
