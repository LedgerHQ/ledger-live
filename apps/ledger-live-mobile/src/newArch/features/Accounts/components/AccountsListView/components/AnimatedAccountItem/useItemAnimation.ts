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
  size: {
    duration: 500,
    from: 0,
    to: 100,
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
  const height = useSharedValue(ANIMATION_CONFIG.size.from);
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

  const animatedStyle = useAnimatedStyle(() => ({
    height: `${height.value}%`,
    opacity: opacity.value,
    transform: [{ translateY: y.value }, { translateY: centerY.value }, { scale: scale.value }],
    flex: 1,
  }));

  const startAnimation = useCallback(() => {
    animate(height, ANIMATION_CONFIG.size.to, ANIMATION_CONFIG.size.duration, baseDelay);
    animate(opacity, 1, ANIMATION_CONFIG.size.duration, baseDelay);
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
  }, [animate, height, baseDelay, opacity, y, centerY, scale]);

  return { animatedStyle, startAnimation };
}
