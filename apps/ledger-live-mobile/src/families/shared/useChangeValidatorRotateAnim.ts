import { useCallback, useEffect, useMemo, useState } from "react";
import { Animated } from "react-native";
import Config from "react-native-config";

// Looping wiggle used on staking/delegation summary screens to hint at the
// "change validator" affordance. Skipped under Detox so the JS bridge can
// reach an idle state — an unbounded Animated.loop schedules a JS callback
// every iteration and prevents Detox's sync from ever settling.
export function useChangeValidatorRotateAnim() {
  const [rotateAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (Config.DETOX) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: -1, duration: 300, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.delay(1000),
      ]),
    );
    loop.start();

    return () => {
      loop.stop();
      rotateAnim.setValue(0);
    };
  }, [rotateAnim]);

  const rotate = useMemo(
    () =>
      rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "30deg"],
      }),
    [rotateAnim],
  );

  const resetRotation = useCallback(() => {
    rotateAnim.setValue(0);
  }, [rotateAnim]);

  return { rotate, resetRotation };
}
