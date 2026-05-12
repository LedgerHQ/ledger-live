import { useCallback } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  WithTimingConfig,
} from "react-native-reanimated";

const ANIMATION_CONFIG = {
  opacity: {
    duration: 500,
  },
  position: {
    duration: 350,
    from: 50,
    to: 0,
    yDelay: 100,
  },
  scale: {
    duration: 400,
    from: 0.5,
    to: 1,
    delay: 100,
  },
  itemDelay: 100,
} as const;

const DEFAULT_TIMING_CONFIG: WithTimingConfig = {
  easing: Easing.in(Easing.cubic),
};

export default function useItemAnimation(index: number = 0) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(ANIMATION_CONFIG.position.from);
  const centerY = useSharedValue(ANIMATION_CONFIG.position.from);
  const scale = useSharedValue(ANIMATION_CONFIG.scale.from);

  const animate = useCallback(
    (sharedValue: { value: number }, to: number, duration: number, delay = 0) => {
      sharedValue.value = withDelay(delay, withTiming(to, { ...DEFAULT_TIMING_CONFIG, duration }));
    },
    [],
  );

  const baseDelay = index * ANIMATION_CONFIG.itemDelay;

  // height intentionally omitted: a percent-based height inside a FlatList row
  // whose parent has no explicit height collapses on Android and breaks
  // virtualization (LIVE-30528).
  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: opacity.value,
      transform: [{ translateY: y.value }, { translateY: centerY.value }, { scale: scale.value }],
    }),
    [opacity, y, centerY, scale],
  );

  const startAnimation = useCallback(() => {
    animate(opacity, 1, ANIMATION_CONFIG.opacity.duration, baseDelay);
    animate(
      y,
      ANIMATION_CONFIG.position.to,
      ANIMATION_CONFIG.position.duration,
      baseDelay + ANIMATION_CONFIG.position.yDelay,
    );
    animate(
      centerY,
      ANIMATION_CONFIG.position.to,
      ANIMATION_CONFIG.position.duration + 50,
      baseDelay + ANIMATION_CONFIG.position.yDelay,
    );
    animate(
      scale,
      ANIMATION_CONFIG.scale.to,
      ANIMATION_CONFIG.scale.duration,
      baseDelay + ANIMATION_CONFIG.scale.delay,
    );
  }, [animate, baseDelay, opacity, y, centerY, scale]);

  return { animatedStyle, startAnimation };
}
