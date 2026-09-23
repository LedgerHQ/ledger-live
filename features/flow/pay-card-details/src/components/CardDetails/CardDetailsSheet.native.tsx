import React, { useCallback, useEffect, useRef } from "react";
import {
  BottomSheetHeader,
  BottomSheetScrollView,
  BottomSheetView,
  Box,
} from "@ledgerhq/lumen-ui-rnative";
import { AddToWalletCta } from "@features/flow-pay-card-widget/native";
import { QueuedBottomSheet, useBottomSheetFooterInset } from "@shared/ui-queued-bottom-sheet";
import { CardTopUpButton } from "../CardTopUp";
import { CardDetailsScene } from "./Scenes/CardDetailsScene";
import { CARD_DETAILS_SCENES } from "./Scenes/registry";
import type { CardDetailsSceneProps } from "./Scenes/types";
import type { CardDetailsSheetProps } from "../../types";

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
  // react-native-draggable-flatlist owns its own scrolling FlatList — nesting it inside the
  // shared BottomSheetScrollView below is the classic FlatList-in-a-ScrollView anti-pattern
  // (virtualization + gesture conflicts), so this one scene gets a plain, non-scrolling
  // container instead and lets the list scroll itself.
  const isAssetsManage = scene.route.name === "assetsManage";
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
        isAssetsManage ? (
          <CardDetailsSheetNonScrollContent scene={scene} />
        ) : (
          <CardDetailsSheetContent scene={scene} />
        )
      ) : null}
    </QueuedBottomSheet>
  );
}

function CardDetailsSheetNonScrollContent({ scene }: Readonly<{ scene: CardDetailsSceneProps }>) {
  const footerInset = useBottomSheetFooterInset();

  return (
    <BottomSheetView>
      <Box style={{ paddingBottom: footerInset }}>
        <Box lx={{ paddingBottom: "s24" }}>
          <BottomSheetHeader
            density="compact"
            spacing
            title={scene.header.title}
            description={scene.header.description}
          />
          <CardDetailsScene {...scene} />
        </Box>
      </Box>
    </BottomSheetView>
  );
}

function CardDetailsSheetContent({ scene }: Readonly<{ scene: CardDetailsSceneProps }>) {
  const footerInset = useBottomSheetFooterInset();

  return (
    <BottomSheetScrollView>
      <Box style={{ paddingBottom: footerInset }}>
        <Box lx={{ paddingBottom: "s24" }}>
          <BottomSheetHeader
            density="compact"
            spacing
            title={scene.header.title}
            description={scene.header.description}
          />
          <CardDetailsScene {...scene} />
        </Box>
      </Box>
    </BottomSheetScrollView>
  );
}
