import React, { useState, useCallback, useEffect } from "react";
import { TouchableHighlight } from "react-native";
import Animated, {
  Extrapolate,
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";
import { ToastData } from "@ledgerhq/live-common/notifications/ToastProvider/types";
import { Notification } from "@ledgerhq/native-ui";
import {
  CircledCheckSolidMedium,
  InfoMedium,
  WarningMedium,
} from "@ledgerhq/native-ui/assets/icons";
import getWindowDimensions from "~/logic/getWindowDimensions";

const { width } = getWindowDimensions();

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableHighlight);

type Props = {
  toast: ToastData;
  cta?: string;
  onPress: (_: ToastData) => void;
  onClose?: (_: ToastData) => void;
};

const icons = {
  info: InfoMedium,
  warning: WarningMedium,
  success: CircledCheckSolidMedium,
};

type IconsKeys = keyof typeof icons;

export default function Snackbar({ toast, cta, onPress, onClose }: Props) {
  const { title, text, type, icon } = toast;

  const [closed, setIsClosed] = useState(false);
  const openState = useSharedValue(0);

  // Updates the animated open state
  useEffect(() => {
    openState.value = withTiming(closed ? 0 : 1, {
      duration: 800,
      easing: Easing.ease,
    });
  }, [closed, openState]);

  const handleClose = useCallback(() => {
    setIsClosed(true);
    setTimeout(() => onClose && onClose(toast), 1000);
  }, [onClose, toast]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (type === "success") {
      timeout = setTimeout(handleClose, 5000);
    }

    return () => {
      timeout && clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOnPress = useCallback(() => {
    onPress(toast);
  }, [onPress, toast]);

  const Icon = icon ? icons[icon as IconsKeys] : undefined;

  const animatedTouchableOpacityStyle = useAnimatedStyle(() => {
    const maxHeight = interpolate(openState.value, [0, 0.4, 1], [0, 200, 200], Extrapolate.CLAMP);

    const translateX = interpolate(
      openState.value,
      [0, 0.6, 1],
      [width + 100, width - 100, 0],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(openState.value, [0, 0.6, 1], [0, 0, 1], Extrapolate.CLAMP);

    const marginBottom = interpolate(openState.value, [0, 0.4, 1], [0, 8, 8], Extrapolate.CLAMP);

    return {
      maxHeight,
      transform: [{ translateX }],
      opacity,
      marginBottom,
    };
  });

  const notificationProps =
    type === "success"
      ? {
          variant: "plain",
          iconColor: "success.c60",
          title,
          subtitle: text || undefined,
        }
      : {
          variant: "primary",
          title: type || title,
          subtitle: type ? title : text || undefined,
        };

  return (
    <AnimatedTouchableOpacity
      style={[
        {
          borderRadius: 4,
        },
        animatedTouchableOpacityStyle,
      ]}
      onPress={handleOnPress}
    >
      <Notification
        {...notificationProps}
        Icon={Icon}
        linkText={cta}
        onLinkPress={handleOnPress}
        onClose={onClose && handleClose}
      />
    </AnimatedTouchableOpacity>
  );
}
