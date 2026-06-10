import { useCallback } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
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
  // Resting (default) values are the FINAL, visible state. The enter animation
  // snaps to the hidden start and plays in from there. Initializing to the visible
  // state means that if a reanimated update is dropped during a batched mount
  // (Fabric / React 19 scheduler), the row is left VISIBLE instead of stranded at
  // the hidden initial value — which is what made the first scanned account vanish
  // when later accounts arrived (LIVE-29164).
  const opacity = useSharedValue(1);
  const y = useSharedValue(ANIMATION_CONFIG.position.to);
  const centerY = useSharedValue(ANIMATION_CONFIG.position.to);
  const scale = useSharedValue(ANIMATION_CONFIG.scale.to);

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

  const enterFrom = useCallback(
    (sharedValue: { value: number }, from: number, to: number, duration: number, delay: number) => {
      // The "jump to hidden" is the first step of the animation (not a direct
      // assignment), so if the sequence is dropped the value falls back to the
      // visible resting default rather than sticking at the hidden start.
      sharedValue.value = withSequence(
        withTiming(from, { duration: 0 }),
        withDelay(delay, withTiming(to, { ...DEFAULT_TIMING_CONFIG, duration })),
      );
    },
    [],
  );

  const startAnimation = useCallback(() => {
    enterFrom(opacity, 0, 1, ANIMATION_CONFIG.opacity.duration, baseDelay);
    enterFrom(
      y,
      ANIMATION_CONFIG.position.from,
      ANIMATION_CONFIG.position.to,
      ANIMATION_CONFIG.position.duration,
      baseDelay + ANIMATION_CONFIG.position.yDelay,
    );
    enterFrom(
      centerY,
      ANIMATION_CONFIG.position.from,
      ANIMATION_CONFIG.position.to,
      ANIMATION_CONFIG.position.duration + 50,
      baseDelay + ANIMATION_CONFIG.position.yDelay,
    );
    enterFrom(
      scale,
      ANIMATION_CONFIG.scale.from,
      ANIMATION_CONFIG.scale.to,
      ANIMATION_CONFIG.scale.duration,
      baseDelay + ANIMATION_CONFIG.scale.delay,
    );
  }, [enterFrom, baseDelay, opacity, y, centerY, scale]);

  return { animatedStyle, startAnimation };
}
