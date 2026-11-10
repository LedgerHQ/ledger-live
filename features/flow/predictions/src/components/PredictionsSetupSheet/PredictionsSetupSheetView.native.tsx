import React, { useEffect, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetScrollView, Box } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import type {
  PredictionsSetupSheetViewProps,
  SetupContentProps,
} from "./PredictionsSetupSheet.types";
import { useDismissOnAndroidBack } from "../PredictionsSheet/useDismissOnAndroidBack";
import { SetupContent } from "./SetupContent";

/** Rendered inside the sheet, which provides its bottom inset. */
function SetupSheetBody({ outcome, onDismiss }: SetupContentProps) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    // The sheet sizes itself to this scroll view, which also scrolls an outcome too tall for it.
    <BottomSheetScrollView alwaysBounceVertical={false} showsVerticalScrollIndicator={false}>
      <BottomSheetHeader density="compact" spacing />
      <Box style={{ paddingBottom: bottomInset + 16 }}>
        <SetupContent outcome={outcome} onDismiss={onDismiss} />
      </Box>
    </BottomSheetScrollView>
  );
}

export function PredictionsSetupSheetView({
  isOpen,
  shownSetup,
  onPresented,
  onDismiss,
}: PredictionsSetupSheetViewProps) {
  // Open isn't on screen: it can wait behind another sheet or be hidden. Only a sheet the user sees
  // takes the Android back or starts its loading time.
  const [isPresented, setIsPresented] = useState(false);
  const shownSetupKey = shownSetup?.key;
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();

  useDismissOnAndroidBack(isOpen && isPresented, onDismiss);

  // Also when a new setup replaces the one on screen, which doesn't open the sheet again.
  useEffect(() => {
    if (isOpen && isPresented) onPresented();
  }, [isOpen, isPresented, shownSetupKey, onPresented]);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onHeaderClosePressed={onDismiss}
      onBackdropPress={onDismiss}
      onOpened={() => setIsPresented(true)}
      onModalHide={() => setIsPresented(false)}
      enablePanDownToClose={false}
      // The live app waits for the user to close it, so it comes back after a lock or another
      // screen.
      restoreOnFocus
      enableDynamicSizing
      // Lumen's static preset can force Android dynamic sheets full height.
      maxDynamicContentSize={Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset}
      contentHasBottomSpace
      testID="predictions-setup-sheet"
    >
      {shownSetup ? (
        <SetupSheetBody key={shownSetup.key} outcome={shownSetup.outcome} onDismiss={onDismiss} />
      ) : null}
    </QueuedBottomSheet>
  );
}
