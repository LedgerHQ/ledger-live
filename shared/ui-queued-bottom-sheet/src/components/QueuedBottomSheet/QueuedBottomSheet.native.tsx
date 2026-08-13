import React from "react";
import { Platform, View } from "react-native";
import { BottomSheet } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IsInBottomSheetProvider } from "../../contexts/IsInBottomSheetContext";
import { BottomSheetBackgroundContext } from "../../contexts/BottomSheetBackgroundContext";
import { useQueuedBottomSheet } from "../../internals/useQueuedBottomSheet";
import type { QueuedBottomSheetProps } from "./types";

export function QueuedBottomSheet({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onHeaderClosePressed,
  onBackdropPress,
  onBack,
  hasBackButton,
  onModalHide,
  noCloseButton,
  preventBackdropClick,
  hideHandle,
  children,
  snapPoints = ["70%", "90%"],
  enableDynamicSizing = false,
  enablePanDownToClose,
  enableBlurKeyboardOnGesture,
  enableHandlePanningGesture,
  maxDynamicContentSize,
  testID,
}: QueuedBottomSheetProps) {
  const {
    measureRef,
    bottomSheetRef,
    areBottomSheetsLocked,
    handleBackdropPress,
    handleHeaderClosePressed,
    handleDismiss,
    handleCloseAnimationStart,
    onBack: hookOnBack,
    enablePanDownToClose: computedEnablePanDownToClose,
    backgroundContextValue,
    backgroundComponent,
  } = useQueuedBottomSheet({
    isRequestingToBeOpened,
    isForcingToBeOpened,
    onClose,
    onBack,
    onHeaderClosePressed,
    onBackdropPress,
    onModalHide,
    preventBackdropClick,
  });

  return (
    <BottomSheet
      ref={bottomSheetRef}
      testID={testID}
      snapPoints={enableDynamicSizing ? null : snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose={enablePanDownToClose ?? computedEnablePanDownToClose}
      enableBlurKeyboardOnGesture={enableBlurKeyboardOnGesture}
      enableHandlePanningGesture={enableHandlePanningGesture}
      maxDynamicContentSize={maxDynamicContentSize}
      hideCloseButton={noCloseButton || areBottomSheetsLocked}
      hideHandle={hideHandle}
      onBack={hasBackButton ? hookOnBack : undefined}
      onHeaderClosePressed={handleHeaderClosePressed}
      onAnimate={handleCloseAnimationStart}
      onDismiss={handleDismiss}
      backdropPressBehavior={preventBackdropClick || areBottomSheetsLocked ? "none" : "close"}
      onBackdropPress={handleBackdropPress}
      backgroundComponent={backgroundComponent}
    >
      {/* QAA-1476 instrumentation: a 1x1 absolute marker at the sheet content's origin, so the
          hook can measureInWindow after present() without touching layout. Wrapping the children
          instead collapsed them to height 0 and broke every run. Not for merge. */}
      <View
        ref={measureRef}
        collapsable={false}
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, width: 1, height: 1 }}
      />
      <BottomSheetBackgroundContext.Provider value={backgroundContextValue}>
        <IsInBottomSheetProvider>{children}</IsInBottomSheetProvider>
      </BottomSheetBackgroundContext.Provider>
      <OnscreenNavigationSafeArea />
    </BottomSheet>
  );
}

function OnscreenNavigationSafeArea() {
  const insets = useSafeAreaInsets();
  return <View style={{ height: Platform.OS === "android" ? insets.bottom : 0 }} />;
}
