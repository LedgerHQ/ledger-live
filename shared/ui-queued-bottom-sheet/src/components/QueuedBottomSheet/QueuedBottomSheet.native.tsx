import React from "react";
import { Platform, View } from "react-native";
import { BottomSheet } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IsInBottomSheetProvider } from "../../contexts/IsInBottomSheetContext";
import { BottomSheetBackgroundContext } from "../../contexts/BottomSheetBackgroundContext";
import { useQueuedBottomSheet } from "../../internals/useQueuedBottomSheet";
import type { QueuedBottomSheetProps } from "./types";

// Default "switch" only minimizes the outgoing sheet. Lumen forwards this to gorhom.
const replaceStackBehavior = { stackBehavior: "replace" } as const;

export function QueuedBottomSheet({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onHeaderClosePressed,
  onBackdropPress,
  onBack,
  hasBackButton,
  onOpened,
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
    bottomSheetRef,
    areBottomSheetsLocked,
    handleBackdropPress,
    handleHeaderClosePressed,
    handleDismiss,
    handleAnimate,
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
      {...replaceStackBehavior}
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
      onAnimate={handleAnimate}
      onOpen={onOpened}
      onDismiss={handleDismiss}
      backdropPressBehavior={preventBackdropClick || areBottomSheetsLocked ? "none" : "close"}
      onBackdropPress={handleBackdropPress}
      backgroundComponent={backgroundComponent}
    >
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
