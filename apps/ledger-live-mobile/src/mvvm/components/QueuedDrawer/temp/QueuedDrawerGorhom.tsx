import React, { useCallback, useMemo } from "react";
import { Platform, StyleProp, ViewStyle } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProps,
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetSectionList,
  BottomSheetView,
  BottomSheetVirtualizedList,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import { IsInDrawerProvider } from "~/context/IsInDrawerContext";
import { useTheme } from "styled-components/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useQueuedDrawerGorhom from "./useQueuedDrawerGorhom";
import BackDrop from "./components/BackDrop";
import Header from "./components/Header";
import { Box } from "@ledgerhq/native-ui";

export {
  BottomSheetFlatList,
  BottomSheetScrollView,
  BottomSheetSectionList,
  BottomSheetView,
  BottomSheetVirtualizedList,
};

export type Props = Omit<BottomSheetModalProps, "snapPoints" | "children"> & {
  isRequestingToBeOpened?: boolean;
  isForcingToBeOpened?: boolean;
  title?: string;
  noCloseButton?: boolean;
  hasBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  onModalHide?: () => void;
  preventBackdropClick?: boolean;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  snapPoints?: (string | number)[];
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
  snapPoints = ["70%", "90%"],
  enableDynamicSizing = false,
  ...rest
}: Props) => {
  const { colors } = useTheme();

  const {
    bottomSheetRef,
    areDrawersLocked,
    handleUserClose,
    handleDismiss,
    onBack: hookOnBack,
    enablePanDownToClose,
    showBackdropPress,
  } = useQueuedDrawerGorhom({
    isRequestingToBeOpened,
    isForcingToBeOpened,
    onClose,
    onBack,
    onModalHide,
    preventBackdropClick,
  });

  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 150,
  });

  const onBackdropPress = useCallback(() => {
    handleUserClose();
  }, [handleUserClose]);

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BackDrop showBackdropPress={showBackdropPress} onPress={onBackdropPress} {...props} />
    ),
    [showBackdropPress, onBackdropPress],
  );

  const renderHeader = useCallback(() => {
    const shouldShowHeader = title || hasBackButton || (!noCloseButton && !areDrawersLocked);

    if (!shouldShowHeader) return null;

    return (
      <Header
        title={title}
        hasBackButton={hasBackButton}
        hookOnBack={hookOnBack}
        noCloseButton={noCloseButton}
        areDrawersLocked={areDrawersLocked}
        handleCloseUserEvent={handleUserClose}
      />
    );
  }, [title, hasBackButton, noCloseButton, areDrawersLocked, hookOnBack, handleUserClose]);

  const finalSnapPoints = useMemo(
    () => (enableDynamicSizing ? undefined : snapPoints),
    [enableDynamicSizing, snapPoints],
  );

  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: colors.background.drawer,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    }),
    [colors.background.drawer],
  );

  const handleIndicatorStyle = useMemo(
    () => ({
      display: "none" as const,
    }),
    [],
  );

  const combinedStyle = useMemo(
    () => [
      style,
      {
        paddingHorizontal: 16,
      },
    ],
    [style],
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={finalSnapPoints}
      enableDynamicSizing={enableDynamicSizing}
      enablePanDownToClose={enablePanDownToClose}
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      animationConfigs={animationConfigs}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      style={combinedStyle}
      {...rest}
    >
      {renderHeader()}
      <IsInDrawerProvider>{children}</IsInDrawerProvider>
      <OnscreenNavigationSafeArea />
    </BottomSheetModal>
  );
};

const OnscreenNavigationSafeArea = () => {
  const insets = useSafeAreaInsets();
  return <Box height={Platform.OS === "android" ? insets.bottom : 0} />;
};

export default React.memo(QueuedDrawerGorhom);
