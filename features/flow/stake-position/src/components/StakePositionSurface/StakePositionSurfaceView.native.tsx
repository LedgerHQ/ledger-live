import React, { useState, type ReactNode } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetHeader, BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import type { StakePositionSurfaceViewProps } from "./StakePositionSurfaceView.types";
import { useAndroidBack } from "./useAndroidBack";

function SheetBody({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    // The sheet sizes itself to this scroll view, so the header and the actions live inside it.
    <BottomSheetScrollView
      alwaysBounceVertical={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomInset + 16 }}
    >
      <BottomSheetHeader density="expanded" title={title} />
      {children}
    </BottomSheetScrollView>
  );
}

export function StakePositionSurfaceView({
  isOpen,
  title,
  onBack,
  onDismiss,
  isDismissible,
  children,
  testID,
}: StakePositionSurfaceViewProps) {
  const { height: windowHeight } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();

  // A pending request isn't always on screen: it can wait behind another sheet, or be hidden while
  // its screen is unfocused. Only a sheet the user sees may take the Android back.
  const [isPresented, setIsPresented] = useState(false);

  useAndroidBack(isOpen && isPresented, isDismissible ? (onBack ?? onDismiss) : undefined);

  return (
    // `onClose` also fires for programmatic closes, so only explicit user closes dismiss, and
    // pan-down, which only reports through `onClose`, is off.
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      noCloseButton={!isDismissible}
      preventBackdropClick={!isDismissible}
      onHeaderClosePressed={isDismissible ? onDismiss : undefined}
      onBackdropPress={isDismissible ? onDismiss : undefined}
      hasBackButton={onBack !== undefined}
      onBack={onBack}
      onOpened={() => setIsPresented(true)}
      onModalHide={() => setIsPresented(false)}
      enablePanDownToClose={false}
      // A lock or another screen only hides the sheet: the request still waits for the user.
      restoreOnFocus
      enableDynamicSizing
      maxDynamicContentSize={Platform.OS === "ios" ? "fullWithOffset" : windowHeight - topInset}
      contentHasBottomSpace
      testID={testID}
    >
      <SheetBody title={title}>{children}</SheetBody>
    </QueuedBottomSheet>
  );
}
