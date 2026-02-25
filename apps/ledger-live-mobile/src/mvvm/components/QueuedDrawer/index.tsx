import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Modal, Pressable, StyleProp, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useTheme } from "styled-components/native";
import { Flex, Text, BoxedIcon, Icons } from "@ledgerhq/native-ui";
import { IsInDrawerProvider } from "~/context/IsInDrawerContext";
import useQueuedDrawerNative from "./useQueuedDrawerNative";
import Header from "./Header";

export type Props = {
  isRequestingToBeOpened?: boolean;
  isForcingToBeOpened?: boolean;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  Icon?: React.ComponentType | React.ReactNode;
  iconColor?: string;
  subtitle?: string;
  noCloseButton?: boolean;
  hasBackButton?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  onModalHide?: () => void;
  preventBackdropClick?: boolean;
  preventKeyboardDismissOnClose?: boolean;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  CustomHeader?: React.ComponentType<{ children?: React.ReactNode }>;
  onBackdropPress?: () => void;
  onBackButtonPress?: () => void;
  onSwipeComplete?: () => void;
  propagateSwipe?: boolean;
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
  preventKeyboardDismissOnClose,
  style,
  containerStyle,
  children,
  title,
  description,
  Icon,
  iconColor,
  subtitle,
  CustomHeader,
  onBackdropPress: _onBackdropPress,
  onBackButtonPress: _onBackButtonPress,
  onSwipeComplete: _onSwipeComplete,
  propagateSwipe: _propagateSwipe,
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
    preventKeyboardDismissOnClose,
  });

  const translateY = useSharedValue(1000);
  const backdropOpacity = useSharedValue(0);
  const closeAnimTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openAnim = useCallback(() => {
    translateY.value = withTiming(0, {
      duration: ANIMATION_DURATION,
      easing: Easing.out(Easing.cubic),
    });
    backdropOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });
  }, [translateY, backdropOpacity]);

  const closeAnim = useCallback(
    (after?: () => void) => {
      // Cancel any pending callback from a previous closeAnim call
      if (closeAnimTimeoutRef.current) {
        clearTimeout(closeAnimTimeoutRef.current);
        closeAnimTimeoutRef.current = null;
      }

      // Build the once-only callback on the JS thread (not in a worklet)
      // so that refs remain accessible when scheduled back via scheduleOnRN.
      const afterOnce = after
        ? () => {
            if (!closeAnimTimeoutRef.current) return;
            clearTimeout(closeAnimTimeoutRef.current);
            closeAnimTimeoutRef.current = null;
            after();
          }
        : undefined;

      // Timeout fallback in case the animation completion callback doesn't fire
      if (afterOnce) {
        closeAnimTimeoutRef.current = setTimeout(afterOnce, ANIMATION_DURATION + 50);
      }

      translateY.value = withTiming(
        1000,
        { duration: ANIMATION_DURATION, easing: Easing.in(Easing.cubic) },
        () => {
          if (afterOnce) {
            scheduleOnRN(afterOnce);
          }
        },
      );
      backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION });
    },
    [translateY, backdropOpacity],
  );

  const containerAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: translateY.value }],
    }),
    [translateY],
  );

  const backdropAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: backdropOpacity.value,
    }),
    [backdropOpacity],
  );

  const onShow = useCallback(() => {
    openAnim();
  }, [openAnim]);

  const handleCloseUserEvent = useCallback(() => {
    closeAnim(() => {
      requestAnimationFrame(() => {
        handleDismiss();
      });
    });
  }, [closeAnim, handleDismiss]);

  const onRequestClose = useCallback(() => {
    if (!enablePanDownToClose) return;
    closeAnim(() => {
      requestAnimationFrame(() => {
        handleDismiss();
      });
    });
  }, [enablePanDownToClose, closeAnim, handleDismiss]);

  const onBackdropPress = useCallback(() => {
    if (!enablePanDownToClose) return;

    if (_onBackdropPress) {
      _onBackdropPress();
    }

    closeAnim(() => {
      requestAnimationFrame(() => {
        handleDismiss();
      });
    });
  }, [enablePanDownToClose, closeAnim, handleDismiss, _onBackdropPress]);

  const shouldShowHeader = useMemo(
    () => CustomHeader || title || hasBackButton || (!noCloseButton && !areDrawersLocked),
    [CustomHeader, title, hasBackButton, noCloseButton, areDrawersLocked],
  );

  const shouldShowModalHeader = useMemo(
    () => Icon || subtitle || description,
    [Icon, subtitle, description],
  );

  // Close when opening conditions are no longer met (e.g., action succeeded)
  useEffect(() => {
    if (isVisible && !isRequestingToBeOpened && !isForcingToBeOpened) {
      closeAnim(() => {
        requestAnimationFrame(() => {
          handleDismiss();
        });
      });
    }
  }, [isVisible, isRequestingToBeOpened, isForcingToBeOpened, closeAnim, handleDismiss]);

  function renderDrawerIcon() {
    if (React.isValidElement(Icon)) return Icon;
    if (typeof Icon === "function")
      return <BoxedIcon size={64} Icon={Icon} iconSize={24} iconColor={iconColor} />;
    return null;
  }

  return (
    <Flex>
      <Modal
        presentationStyle="overFullScreen"
        animationType="none"
        transparent
        visible={isVisible}
        onShow={onShow}
        onRequestClose={onRequestClose}
        statusBarTranslucent={true}
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
                width: "100%",
                maxHeight: "95%",
                backgroundColor: colors.background.drawer,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              },
              containerStyle || undefined,
            ]}
          >
            {shouldShowHeader && CustomHeader ? (
              <CustomHeader>
                {!noCloseButton && !areDrawersLocked ? (
                  <Pressable
                    testID="modal-close-button"
                    onPress={handleCloseUserEvent}
                    hitSlop={16}
                    accessible={true}
                    style={({ pressed }: { pressed: boolean }) => ({
                      position: "absolute",
                      zIndex: 10,
                      top: 16,
                      right: 16,
                      borderRadius: 999,
                      backgroundColor: pressed
                        ? colors.opacityReverse.c50
                        : colors.opacityReverse.c70,
                      padding: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                    })}
                  >
                    <Icons.Close size="XS" />
                  </Pressable>
                ) : null}
              </CustomHeader>
            ) : null}

            <View
              style={{
                width: "100%",
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: insets.bottom + 16,
              }}
            >
              {shouldShowHeader && !CustomHeader ? (
                <Header
                  title={title}
                  hasBackButton={hasBackButton}
                  hookOnBack={hookOnBack}
                  noCloseButton={noCloseButton}
                  areDrawersLocked={areDrawersLocked}
                  handleCloseUserEvent={handleCloseUserEvent}
                />
              ) : null}

              {shouldShowModalHeader ? (
                <Flex alignItems="center" mb={7}>
                  {renderDrawerIcon()}
                  {subtitle && (
                    <Text variant="subtitle" color="neutral.c80" textAlign="center" mb={2}>
                      {subtitle}
                    </Text>
                  )}
                  {description && (
                    <Text variant="body" color="neutral.c70" textAlign="center" mt={6}>
                      {description}
                    </Text>
                  )}
                </Flex>
              ) : null}

              {children && (
                <View style={style || undefined}>
                  <IsInDrawerProvider>{children}</IsInDrawerProvider>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </Flex>
  );
};

export default React.memo(QueuedDrawerNative);
