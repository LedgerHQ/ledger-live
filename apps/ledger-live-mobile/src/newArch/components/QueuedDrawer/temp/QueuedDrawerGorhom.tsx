import React, { useCallback } from "react";
import { Platform, StyleProp, ViewStyle } from "react-native";
import { IsInDrawerProvider } from "~/context/IsInDrawerContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useQueuedDrawerGorhom from "./useQueuedDrawerGorhom";
import { Box } from "@ledgerhq/native-ui";
import {
  BottomSheet,
  BottomSheetProps,
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetSectionList,
  BottomSheetVirtualizedList,
} from "@ledgerhq/lumen-ui-rnative";

export {
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetSectionList,
  BottomSheetVirtualizedList,
};

export type Props = Omit<BottomSheetProps, "snapPoints" | "children"> & {
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
  snapPoints?: number[] | string[] | "small" | "full" | "fullWithOffset" | "medium" | null;
  enableDynamicSizing?: boolean;
};

const QueuedDrawerGorhom = ({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onBack,
  hasBackButton,
  onModalHide,
  noCloseButton,
  preventBackdropClick,
  style,
  containerStyle,
  children,
  title,
  testID,
  enableDynamicSizing = false,
  ...rest
}: Props) => {
  const {
    bottomSheetRef,
    areDrawersLocked,
    handleUserClose,
    handleDismiss,

    onBack: hookOnBack,
    enablePanDownToClose,
  } = useQueuedDrawerGorhom({
    isRequestingToBeOpened,
    isForcingToBeOpened,
    onClose,
    onBack,
    onModalHide,
    preventBackdropClick,
  });

  const onBackdropPress = useCallback(() => {
    handleUserClose();
  }, [handleUserClose]);

  const handleBack = hasBackButton ? hookOnBack : undefined;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      testID={testID}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose={enablePanDownToClose}
      onClose={handleDismiss}
      enableBlurKeyboardOnGesture={true}
      onBack={handleBack}
      onBackdropPress={onBackdropPress}
      hideCloseButton={areDrawersLocked}
      detached={true}
      {...rest}
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

export default React.memo(QueuedDrawerGorhom);
