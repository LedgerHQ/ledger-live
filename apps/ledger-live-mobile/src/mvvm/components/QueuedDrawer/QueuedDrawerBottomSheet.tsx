import React, { useCallback } from "react";
import { Platform, StyleProp, ViewStyle } from "react-native";
import { IsInDrawerProvider } from "~/context/IsInDrawerContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useQueuedDrawerBottomSheet from "./useQueuedDrawerBottomSheet";
import { Box } from "@ledgerhq/native-ui";
import {
  BottomSheet,
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetSectionList,
  BottomSheetVirtualizedList,
  BottomSheetView,
  BottomSheetHeader,
} from "@ledgerhq/lumen-ui-rnative";

export {
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetSectionList,
  BottomSheetVirtualizedList,
  BottomSheetView,
  BottomSheetHeader,
};

export type Props = {
  isRequestingToBeOpened?: boolean;
  isForcingToBeOpened?: boolean;
  title?: string;
  noCloseButton?: boolean;
  hasBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  onModalHide?: () => void;
  preventBackdropClick?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  snapPoints?: "full" | "fullWithOffset" | "medium" | "small" | string[] | number[] | null;
  enableDynamicSizing?: boolean;
};

const QueuedDrawerBottomSheet = ({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onBack,
  hasBackButton,
  onModalHide,
  noCloseButton,
  preventBackdropClick,
  children,
  testID,
  snapPoints = "fullWithOffset",
  enableDynamicSizing = false,
}: Props) => {
  const {
    bottomSheetRef,
    areDrawersLocked,
    handleUserClose,
    handleDismiss,
    onBack: hookOnBack,
    enablePanDownToClose,
  } = useQueuedDrawerBottomSheet({
    isRequestingToBeOpened,
    isForcingToBeOpened,
    onClose,
    onBack,
    onModalHide,
    preventBackdropClick,
  });

  const handleBackdropPress = useCallback(() => {
    if (enablePanDownToClose) {
      handleUserClose();
    }
  }, [enablePanDownToClose, handleUserClose]);

  const handleBack = hasBackButton ? hookOnBack : undefined;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      testID={testID}
      snapPoints={snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose={enablePanDownToClose}
      enableBlurKeyboardOnGesture={true}
      onClose={handleDismiss}
      onBack={handleBack}
      onBackdropPress={handleBackdropPress}
      hideCloseButton={areDrawersLocked || noCloseButton}
      detached={true}
    >
      <IsInDrawerProvider>{children}</IsInDrawerProvider>
      <OnscreenNavigationSafeArea />
    </BottomSheet>
  );
};

const OnscreenNavigationSafeArea = () => {
  const insets = useSafeAreaInsets();
  return <Box height={Platform.OS === "android" ? insets.bottom : 0} />;
};

export default React.memo(QueuedDrawerBottomSheet);
