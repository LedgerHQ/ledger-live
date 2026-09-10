import React, { useCallback, useEffect, useRef } from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { CardDetailsScene } from "./Scenes/CardDetailsScene";
import { CARD_DETAILS_SCENES } from "./Scenes/registry";
import type { CardDetailsSheetProps } from "../../types";

export function CardDetailsSheet({ isOpen, scene, onClose }: CardDetailsSheetProps) {
  const dismissed = useRef(false);
  const isPending = scene.freeze.viewModel.confirmState === "pending";
  const sizing = CARD_DETAILS_SCENES[scene.route.name].sizing;
  const sizingProps =
    sizing === "full"
      ? ({ snapPoints: "fullWithOffset" } as const)
      : ({ enableDynamicSizing: true, maxDynamicContentSize: "fullWithOffset" } as const);

  useEffect(() => {
    if (isOpen) {
      dismissed.current = false;
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (isPending || dismissed.current) {
      return;
    }
    dismissed.current = true;
    onClose();
  }, [isPending, onClose]);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={handleClose}
      noCloseButton={isPending}
      preventBackdropClick={isPending}
      enablePanDownToClose={!isPending}
      {...sizingProps}
      testID="card-details-sheet"
    >
      {isOpen ? (
        <BottomSheetView>
          <Box lx={{ paddingBottom: "s24" }}>
            <BottomSheetHeader density="compact" spacing />
            <CardDetailsScene {...scene} />
          </Box>
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}
