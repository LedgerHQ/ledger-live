import { useEffect } from "react";
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

// Looping wiggle used on staking/delegation summary screens to hint at the
// "change validator" affordance. Runs entirely on the UI thread via worklets,
// so the JS bridge stays idle (RN's Animated.loop + Animated.sequence would
// fire a JS callback between iterations and deadlock Detox sync).
const TIMING = { easing: Easing.linear };

export function useChangeValidatorRotateAnim() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(30, { ...TIMING, duration: 200 }),
        withTiming(-30, { ...TIMING, duration: 300 }),
        withTiming(0, { ...TIMING, duration: 200 }),
        withDelay(1000, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(rotation);
  }, [rotation]);

  const transformStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const resetRotation = () => {
    cancelAnimation(rotation);
    rotation.value = 0;
  };

  return { transformStyle, resetRotation };
}
