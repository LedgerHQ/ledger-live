import React, { useCallback, useEffect, useRef } from "react";
import { BottomSheetHeader, BottomSheetScrollView, Box } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { CardTopUpButton } from "../CardTopUp";
import { CardDetailsScene } from "./Scenes/CardDetailsScene";
import { CARD_DETAILS_SCENES } from "./Scenes/registry";
import type { CardDetailsSheetProps } from "../../types";

export function CardDetailsSheet({
  isOpen,
  scene,
  onTopUp,
  onClose,
  onBack,
}: CardDetailsSheetProps) {
  const dismissed = useRef(false);
  const isPending = scene.freeze.viewModel.confirmState === "pending";
  const { sizing, hasBackButton } = CARD_DETAILS_SCENES[scene.route.name];
  const canGoBack = hasBackButton && !isPending;
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
      // Show more leaves for the host's transaction history, and the sheet is expected back when
      // the user returns: a screen losing focus must not read as the user closing the sheet.
      restoreOnFocus
      hasBackButton={canGoBack}
      onBack={canGoBack ? onBack : undefined}
      {...sizingProps}
      testID="card-details-sheet"
    >
      {isOpen ? (
        <>
          <BottomSheetScrollView>
            <Box lx={{ paddingBottom: "s24" }}>
              <BottomSheetHeader density="compact" spacing />
              <CardDetailsScene {...scene} />
            </Box>
          </BottomSheetScrollView>
          {scene.route.name === "overview" ? (
            <Box lx={{ paddingHorizontal: "s16", paddingBottom: "s24" }}>
              <CardTopUpButton onTopUp={onTopUp} />
            </Box>
          ) : null}
        </>
      ) : null}
    </QueuedBottomSheet>
  );
}
