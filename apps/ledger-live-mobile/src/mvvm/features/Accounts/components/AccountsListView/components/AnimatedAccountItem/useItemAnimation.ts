import { useCallback } from "react";
import { withTiming, withDelay, Easing, WithTimingConfig } from "react-native-reanimated";

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
  const baseDelay = index * ANIMATION_CONFIG.itemDelay;

  // We use a declarative "entering" layout animation rather than a shared value
  // animated on mount via useEffect. With the shared-value approach the row's
  // resting opacity is 0 and only the mount-time animation makes it visible, so
  // whenever a row instance was reused/recreated mid-render (which happens when
  // the add-account screen switches from scanning to the selection list) the
  // value stayed at 0 and the row vanished while still counted in the header
  // (LIVE-30528). With "entering" the resting style is the natural, fully
  // visible style, so an interrupted or skipped animation can never leave a row
  // stuck invisible.
  const entering = useCallback(() => {
    "worklet";
    return {
      initialValues: {
        opacity: 0,
        transform: [
          { translateY: ANIMATION_CONFIG.position.from },
          { translateY: ANIMATION_CONFIG.position.from },
          { scale: ANIMATION_CONFIG.scale.from },
        ],
      },
      animations: {
        opacity: withDelay(
          baseDelay,
          withTiming(1, { ...DEFAULT_TIMING_CONFIG, duration: ANIMATION_CONFIG.opacity.duration }),
        ),
        transform: [
          {
            translateY: withDelay(
              baseDelay + ANIMATION_CONFIG.position.yDelay,
              withTiming(ANIMATION_CONFIG.position.to, {
                ...DEFAULT_TIMING_CONFIG,
                duration: ANIMATION_CONFIG.position.duration,
              }),
            ),
          },
          {
            translateY: withDelay(
              baseDelay + ANIMATION_CONFIG.position.yDelay,
              withTiming(ANIMATION_CONFIG.position.to, {
                ...DEFAULT_TIMING_CONFIG,
                duration: ANIMATION_CONFIG.position.duration + 50,
              }),
            ),
          },
          {
            scale: withDelay(
              baseDelay + ANIMATION_CONFIG.scale.delay,
              withTiming(ANIMATION_CONFIG.scale.to, {
                ...DEFAULT_TIMING_CONFIG,
                duration: ANIMATION_CONFIG.scale.duration,
              }),
            ),
          },
        ],
      },
    };
  }, [baseDelay]);

  return { entering };
}
