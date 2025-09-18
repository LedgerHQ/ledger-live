import React, { useCallback, useMemo } from "react";
import { Modal, Platform, Pressable, StyleProp, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useTheme } from "styled-components/native";
import { IsInDrawerProvider } from "~/context/IsInDrawerContext";
import useQueuedDrawerNative from "./useQueuedDrawerNative";
import Header from "./components/Header";

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
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const ANIMATION_DURATION = 250;

const QueuedDrawerNative = ({
  isRequestingToBeOpened = false,
  isForcingToBeOpened = false,
  onClose,
  onBack,
  onModalHide,
  noCloseButton,
  hasBackButton,
  preventBackdropClick,
  style,
  containerStyle,
  children,
  title,
}: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    areDrawersLocked,
    isVisible,
    handleDismiss,
    onBack: hookOnBack,
    enablePanDownToClose,
  } = useQueuedDrawerNative({
    isRequestingToBeOpened,
    isForcingToBeOpened,
    onClose,
    onBack,
    onModalHide,
    preventBackdropClick,
  });

  const translateY = useSharedValue(1000);
  const backdropOpacity = useSharedValue(0);

  const openAnim = useCallback(() => {
    translateY.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
    backdropOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
  }, [translateY, backdropOpacity]);

  const closeAnim = useCallback(
    (after?: () => void) => {
      translateY.value = withTiming(
        1000,
        { duration: ANIMATION_DURATION, easing: Easing.in(Easing.cubic) },
        () => {
          if (after) runOnJS(after)();
        },
      );
      backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION });
    },
    [translateY, backdropOpacity],
  );

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const onShow = useCallback(() => {
    openAnim();
  }, [openAnim]);

  const onRequestClose = useCallback(() => {
    if (!enablePanDownToClose) return;
    closeAnim(() => handleDismiss());
  }, [enablePanDownToClose, closeAnim, handleDismiss]);

  const onBackdropPress = useCallback(() => {
    if (!enablePanDownToClose) return;
    closeAnim(() => handleDismiss());
  }, [enablePanDownToClose, closeAnim, handleDismiss]);

  const shouldShowHeader = useMemo(
    () => title || hasBackButton || (!noCloseButton && !areDrawersLocked),
    [title, hasBackButton, noCloseButton, areDrawersLocked],
  );

  return (
    <Modal
      presentationStyle="overFullScreen"
      animationType="none"
      transparent
      visible={isVisible}
      onShow={onShow}
      onRequestClose={onRequestClose}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          testID="drawer-backdrop"
          onPress={onBackdropPress}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.constant.overlay,
          }}
        >
          <Animated.View style={[{ flex: 1 }, backdropAnimatedStyle]} />
        </Pressable>

        <Animated.View
          style={[
            containerAnimatedStyle,
            {
              backgroundColor: colors.background.drawer,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom, 12) + 32,
            },
            containerStyle || undefined,
          ]}
        >
          {shouldShowHeader ? (
            <Header
              title={title}
              hasBackButton={hasBackButton}
              hookOnBack={hookOnBack}
              noCloseButton={noCloseButton}
              areDrawersLocked={areDrawersLocked}
              handleCloseUserEvent={() => closeAnim(() => handleDismiss())}
            />
          ) : null}

          <View style={style || undefined}>
            <IsInDrawerProvider>{children}</IsInDrawerProvider>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default React.memo(QueuedDrawerNative);
