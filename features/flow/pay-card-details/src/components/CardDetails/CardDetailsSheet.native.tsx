import React, { useCallback, useEffect, useRef } from "react";
import {
  BottomSheetHeader,
  BottomSheetScrollView,
  BottomSheetView,
  Box,
} from "@ledgerhq/lumen-ui-rnative";
import { AddToWalletCta } from "@features/flow-pay-card-widget/native";
import {
  QueuedBottomSheet,
  useBottomSheetBottomInset,
  useBottomSheetFooterInset,
} from "@shared/ui-queued-bottom-sheet";
import { CardTopUpButton } from "../CardTopUp";
import { CardDetailsScene } from "./Scenes/CardDetailsScene";
import { CARD_DETAILS_SCENES } from "./Scenes/registry";
import type { CardDetailsSceneProps } from "./Scenes/types";
import type { CardDetailsSheetProps } from "../../types";

/** `s24`, as a number the safe-area and footer insets can be added to. */
const CONTENT_BOTTOM_SPACING = 24;

export function CardDetailsSheet({
  isOpen,
  scene,
  onTopUp,
  onClose,
  onBack,
}: CardDetailsSheetProps) {
  const dismissed = useRef(false);
  const isPending =
    scene.route.name === "freeze" && scene.freeze.viewModel.confirmState === "pending";
  const isOverview = scene.route.name === "overview";
  // The manage scene reorders rows by dragging them, and the content panning gesture would claim
  // that drag as a sheet drag. It keeps only the handle as a way to pan the sheet.
  const isAssetsManage = scene.route.name === "assetsManage";
  const { sizing, scrollable, hasBackButton } = CARD_DETAILS_SCENES[scene.route.name];
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
      enableContentPanningGesture={!isAssetsManage}
      // Show more leaves for the host's transaction history, and the sheet is expected back when
      // the user returns: a screen losing focus must not read as the user closing the sheet.
      restoreOnFocus
      hasBackButton={canGoBack}
      onBack={canGoBack ? onBack : undefined}
      {...sizingProps}
      footer={
        isOpen && isOverview ? (
          <>
            <AddToWalletCta onPress={scene.overview.onAddToWalletPress} />
            {onTopUp ? <CardTopUpButton onTopUp={onTopUp} /> : null}
          </>
        ) : null
      }
      testID="card-details-sheet"
    >
      {isOpen ? (
        scrollable ? (
          <CardDetailsSheetContent scene={scene} />
        ) : (
          <CardDetailsSheetStaticContent scene={scene} />
        )
      ) : null}
    </QueuedBottomSheet>
  );
}

/**
 * A scene the sheet sizes itself to has nowhere to scroll, so it gets no scrollable at all: the
 * header then stays where it is instead of travelling with a bounce.
 */
function CardDetailsSheetStaticContent({ scene }: Readonly<{ scene: CardDetailsSceneProps }>) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetView
      style={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}
      testID="card-details-sheet-static-content"
    >
      <BottomSheetHeader
        density="compact"
        spacing
        title={scene.header.title}
        description={scene.header.description}
      />
      <CardDetailsScene {...scene} />
    </BottomSheetView>
  );
}

function CardDetailsSheetContent({ scene }: Readonly<{ scene: CardDetailsSceneProps }>) {
  const bottomInset = useBottomSheetBottomInset();
  const footerInset = useBottomSheetFooterInset();

  return (
    <BottomSheetScrollView testID="card-details-sheet-content">
      <Box style={{ paddingBottom: bottomInset + footerInset + CONTENT_BOTTOM_SPACING }}>
        <BottomSheetHeader
          density="compact"
          spacing
          title={scene.header.title}
          description={scene.header.description}
        />
        <CardDetailsScene {...scene} />
      </Box>
    </BottomSheetScrollView>
  );
}
