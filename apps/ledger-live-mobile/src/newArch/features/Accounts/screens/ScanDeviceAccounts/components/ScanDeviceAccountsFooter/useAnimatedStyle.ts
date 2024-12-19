import { useEffect, useMemo, useRef } from "react";
import { Animated } from "react-native";

import { ANIMATION_TIMEOUT, sharedAnimationConfiguration } from "../../constants";

export default function useAnimatedStyle() {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const animationTiemout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          ...sharedAnimationConfiguration,
          toValue: 0,
        }),
        Animated.timing(opacity, {
          ...sharedAnimationConfiguration,
          toValue: 1,
        }),
        Animated.timing(scale, {
          ...sharedAnimationConfiguration,
          toValue: 1,
        }),
      ]).start();
    }, ANIMATION_TIMEOUT);
    return () => {
      clearTimeout(animationTiemout);
    };
  }, [translateY, opacity, scale]);

  const animatedSelectableAccount = useMemo(
    () => ({
      transform: [{ translateY }, { scale }],
      opacity,
    }),
    [translateY, scale, opacity],
  );

  return { animatedSelectableAccount };
}
