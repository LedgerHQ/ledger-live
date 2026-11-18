import React, { useEffect, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetScrollView, Box } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import type { PendingResultSheetViewProps } from "./PendingResultSheetView.types";
import { useDismissOnAndroidBack } from "../PredictionsSheet/useDismissOnAndroidBack";

/** Rendered inside the sheet, which provides its bottom inset. */
function SheetBody({ children }: Readonly<{ children: React.ReactNode }>) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    // The sheet sizes itself to this scroll view, which also scrolls an outcome too tall for it.
    <BottomSheetScrollView alwaysBounceVertical={false} showsVerticalScrollIndicator={false}>
      <BottomSheetHeader density="compact" spacing />
      <Box style={{ paddingBottom: bottomInset + 16 }}>{children}</Box>
    </BottomSheetScrollView>
  );
}

export function PendingResultSheetView({
  isOpen,
  contentKey,
  onPresented,
  onDismiss,
  testID,
  children,
}: PendingResultSheetViewProps) {
  // Open isn't on screen: it can wait behind another sheet or be hidden. Only a sheet the user sees
  // takes the Android back or starts its loading time.
  const [isPresented, setIsPresented] = useState(false);
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();

  useDismissOnAndroidBack(isOpen && isPresented, onDismiss);

  // Also when a new request replaces the one on screen, which doesn't open the sheet again.
  useEffect(() => {
    if (isOpen && isPresented) onPresented();
  }, [isOpen, isPresented, contentKey, onPresented]);

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
      testID={testID}
    >
      {contentKey === undefined ? null : <SheetBody key={contentKey}>{children}</SheetBody>}
    </QueuedBottomSheet>
  );
}
