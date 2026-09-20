import React, { useCallback, useEffect, useRef, useState } from "react";
import Animated, { FadeIn } from "react-native-reanimated";
import { BottomSheetHeader, BottomSheetScrollView, Box } from "@ledgerhq/lumen-ui-rnative";
import { AddToWalletCta } from "@features/flow-pay-card-widget/native";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { CardDetailsScene } from "./Scenes/CardDetailsScene";
import type { CardDetailsSheetProps } from "../../types";
import type { CardDetailsSceneProps } from "./Scenes/types";

/** Long enough to read as a transition between scenes, short enough not to delay a tap. */
const SCENE_ENTER_MS = 180;

export function CardDetailsSheet({ isOpen, scene, onClose, onBack }: CardDetailsSheetProps) {
  const dismissed = useRef(false);
  const [hasOpened, setHasOpened] = useState(isOpen);
  const isPending =
    scene.route.name === "freeze" && scene.freeze.viewModel.confirmState === "pending";
  const isOverview = scene.route.name === "overview";
  const canGoBack = scene.route.name !== "overview" && scene.route.name !== "freeze" && !isPending;
  const usesFullHeight =
    scene.route.name === "overview" ||
    scene.route.name === "transaction" ||
    scene.route.name === "assetDetails" ||
    scene.route.name === "assetTransaction";
  const sizingProps = usesFullHeight
    ? ({ snapPoints: "fullWithOffset" } as const)
    : ({
        enableDynamicSizing: true,
        maxDynamicContentSize: "fullWithOffset",
      } as const);

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

  const handleOpened = useCallback(() => {
    setHasOpened(true);
  }, []);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onOpened={handleOpened}
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
        isOpen && isOverview ? <AddToWalletCta onPress={scene.overview.onAddToWalletPress} /> : null
      }
      testID="card-details-sheet"
    >
      {hasOpened || isOpen ? <SheetContent scene={scene} /> : null}
    </QueuedBottomSheet>
  );
}

function SheetContent({ scene }: Readonly<{ scene: CardDetailsSceneProps }>) {
  return (
    <BottomSheetScrollView>
      <Box lx={{ paddingBottom: "s24" }}>
        <BottomSheetHeader
          density="compact"
          spacing
          title={scene.header.title}
          description={scene.header.description}
        />
        {/* Keyed on the route so every scene change plays the fade rather than swapping in place.
            It wraps the whole scene, so a scene's own call to action transitions with its content
            instead of snapping into place on its own. */}
        <Animated.View key={scene.route.name} entering={FadeIn.duration(SCENE_ENTER_MS)}>
          <CardDetailsScene {...scene} />
        </Animated.View>
      </Box>
    </BottomSheetScrollView>
  );
}
