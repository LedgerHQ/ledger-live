import React, { useCallback } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Box } from "@ledgerhq/native-ui";

export interface AnimatedContainerProps {
  children: React.ReactNode;
  onHeightChange?: (height: number) => void;
}

const ANIMATION_TIMING_CONFIG = {
  duration: 200,
  easing: Easing.bezier(0.3, 0, 0, 1),
} as const;

export const AnimatedContainer = ({ children, onHeightChange }: AnimatedContainerProps) => {
  const animatedHeight = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    height: withTiming(animatedHeight.value, ANIMATION_TIMING_CONFIG),
    overflow: "hidden",
  }));

  const onLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const height = event.nativeEvent.layout.height;
      if (height === 0) return;

      animatedHeight.value = height;
      onHeightChange?.(height);
    },
    [animatedHeight, onHeightChange],
  );

  return (
    <Animated.View style={style}>
      <Box onLayout={onLayout}>{children}</Box>
    </Animated.View>
  );
};

export default AnimatedContainer;
