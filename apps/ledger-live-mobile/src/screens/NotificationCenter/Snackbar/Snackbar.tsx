import React, { useState, useCallback } from "react";
import { TouchableHighlight } from "react-native";
import Animated, {
  set,
  interpolateNode,
  Extrapolate,
  useCode,
  EasingNode,
} from "react-native-reanimated";
import { useClock, timing } from "react-native-redash/lib/module/v1";
import { ToastData } from "@ledgerhq/live-common/notifications/ToastProvider/types";
import { Notification } from "@ledgerhq/native-ui";
import { InfoMedium, WarningMedium } from "@ledgerhq/native-ui/assets/icons";
// eslint-disable-next-line import/no-unresolved
import getWindowDimensions from "../../../logic/getWindowDimensions";

const { width } = getWindowDimensions();

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableHighlight);

type Props = {
  toast: ToastData;
  cta?: string;
  onPress: (_: ToastData) => void;
  onClose?: (_: ToastData) => void;
};

const icons = {
  info: InfoMedium,
  warning: WarningMedium,
};

export default function Snackbar({ toast, cta, onPress, onClose }: Props) {
  const [anim] = useState(new Animated.Value(0));
  const clock = useClock();
  const [closed, setIsClosed] = useState(false);

  useCode(
    () =>
      set(
        anim,
        timing({
          duration: 800,
          easing: EasingNode.ease,
          clock,
          from: anim,
          to: new Animated.Value(closed ? 0 : 1),
        }),
      ),
    [closed],
  );

  const handleClose = useCallback(() => {
    setIsClosed(true);
    setTimeout(() => onClose && onClose(toast), 1000);
  }, [onClose, toast]);

  const handleOnPress = useCallback(() => {
    onPress(toast);
  }, [onPress, toast]);

  const { title, text, type, icon } = toast;

  const Icon = icon && icons[icon];

  const maxHeight = interpolateNode(anim, {
    inputRange: [0, 0.4, 1],
    outputRange: [0, 200, 200],
    extrapolate: Extrapolate.CLAMP,
  });

  const translateX = interpolateNode(anim, {
    inputRange: [0, 0.6, 1],
    outputRange: [width + 100, width - 100, 0],
    extrapolate: Extrapolate.CLAMP,
  });

  const opacity = interpolateNode(anim, {
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
    extrapolate: Extrapolate.CLAMP,
  });

  const marginBottom = interpolateNode(anim, {
    inputRange: [0, 0.4, 1],
    outputRange: [0, 8, 8],
    extrapolate: Extrapolate.CLAMP,
  });

  return (
    <AnimatedTouchableOpacity
      style={[
        {
          borderRadius: 4,
        },
        {
          maxHeight,
          transform: [{ translateX }],
          opacity,
          marginBottom,
        },
      ]}
      onPress={handleOnPress}
    >
      <Notification
        variant={"primary"}
        Icon={Icon}
        title={type || title}
        subtitle={type ? title : text}
        linkText={cta}
        onLinkPress={handleOnPress}
        onClose={onClose && handleClose}
      />
    </AnimatedTouchableOpacity>
  );
}
