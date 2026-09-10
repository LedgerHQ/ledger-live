import React, { useEffect, useRef } from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { CardArtwork } from "../CardArtwork/CardArtwork";
import { CardVisual } from "../CardVisual/CardVisual";
import { Freeze } from "../Freeze/Freeze";
import { More } from "../More/More";
import type { CardDetailsSheetProps } from "../../types";

export function CardDetailsSheet({ isOpen, cardVisual, onClose }: CardDetailsSheetProps) {
  const dismissed = useRef(false);

  useEffect(() => {
    if (isOpen) {
      dismissed.current = false;
    }
  }, [isOpen]);

  const handleClose = () => {
    if (dismissed.current) {
      return;
    }
    dismissed.current = true;
    onClose();
  };

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={handleClose}
      snapPoints="fullWithOffset"
      testID="card-details-sheet"
    >
      {isOpen ? (
        <BottomSheetView style={{ paddingBottom: 24 }}>
          <BottomSheetHeader density="compact" spacing />

          <Box lx={{ gap: "s16" }}>
            {cardVisual ? <CardVisual {...cardVisual} /> : <CardArtwork />}

            <Box lx={{ flexDirection: "row", gap: "s8" }}>
              <Freeze />
              <More />
            </Box>
          </Box>
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}
