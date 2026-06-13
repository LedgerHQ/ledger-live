import React, { useCallback } from "react";
import { Platform } from "react-native";
import { BottomSheet, BottomSheetProps, Box } from "@ledgerhq/lumen-ui-rnative";
import { IsInDrawerProvider } from "~/context/IsInDrawerContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetBackgroundContext } from "LLM/contexts/BottomSheetBackgroundContext";
import useQueuedDrawerBottomSheet from "./useQueuedDrawerBottomSheet";

export type QueuedDrawerBottomSheetProps = {
  /** Whether this drawer is requesting to be opened (queued). */
  isRequestingToBeOpened?: boolean;
  /** Whether this drawer should force-open (clears queue). */
  isForcingToBeOpened?: boolean;
  /** Hide the close button in the header. */
  noCloseButton?: boolean;
  /** Show a back button in the header. */
  hasBackButton?: boolean;
  /** Hide the handle. */
  hideHandle?: boolean;
  /** Callback when back button is pressed. */
  onBack?: () => void;
  /** Callback when the drawer is closed. */
  onClose?: () => void;
  /** Callback when the backdrop is pressed. */
  onBackdropPress?: () => void;
  /** Callback after the drawer is fully hidden. */
  onModalHide?: () => void;
  /** Prevent closing via backdrop press. */
  preventBackdropClick?: boolean;
  /** Snap points for the bottom sheet. */
  snapPoints?: BottomSheetProps["snapPoints"];
  /** Enable dynamic sizing based on content. */
  enableDynamicSizing?: boolean;
  /** Enable pan-down-to-close gesture. */
  enablePanDownToClose?: boolean;
  /** Enable blur keyboard on gesture interaction. */
  enableBlurKeyboardOnGesture?: boolean;
  /** Enable handle panning gesture. */
  enableHandlePanningGesture?: boolean;
  /** Maximum dynamic content size. */
  maxDynamicContentSize?: BottomSheetProps["maxDynamicContentSize"];
  /** Test ID for end-to-end tests. */
  testID?: string;
  /** Content of the drawer. */
  children: React.ReactNode;
};

const QueuedDrawerBottomSheet = ({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
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
}: QueuedDrawerBottomSheetProps) => {
  const {
    bottomSheetRef,
    areDrawersLocked,
    handleUserClose,
    handleDismiss,
    handleCloseAnimationStart,
    onBack: hookOnBack,
    enablePanDownToClose: computedEnablePanDownToClose,
    backgroundContextValue,
    backgroundComponent,
  } = useQueuedDrawerBottomSheet({
    isRequestingToBeOpened,
    isForcingToBeOpened,
    onClose,
    onBack,
    onModalHide,
    preventBackdropClick,
  });

  const handleBackdropPress = useCallback(() => {
    onBackdropPress?.();
    handleUserClose();
  }, [handleUserClose, onBackdropPress]);

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
      hideCloseButton={noCloseButton || areDrawersLocked}
      hideHandle={hideHandle}
      onBack={hasBackButton ? hookOnBack : undefined}
      onAnimate={handleCloseAnimationStart}
      onDismiss={handleDismiss}
      backdropPressBehavior={preventBackdropClick || areDrawersLocked ? "none" : "close"}
      onBackdropPress={handleBackdropPress}
      backgroundComponent={backgroundComponent}
    >
      <BottomSheetBackgroundContext.Provider value={backgroundContextValue}>
        <IsInDrawerProvider>{children}</IsInDrawerProvider>
      </BottomSheetBackgroundContext.Provider>
      <OnscreenNavigationSafeArea />
    </BottomSheet>
  );
};

const OnscreenNavigationSafeArea = () => {
  const insets = useSafeAreaInsets();
  return <Box style={{ height: Platform.OS === "android" ? insets.bottom : 0 }} />;
};

export default React.memo(QueuedDrawerBottomSheet);
