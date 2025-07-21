import { useState, useEffect } from "react";
import {
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
  useAnimatedStyle,
} from "react-native-reanimated";
import { ModularDrawerStep } from "../types";

const TRANSITION_CONFIG = {
  duration: 250,
  easing: Easing.bezier(0.17, 0.84, 0.44, 1),
};

const useScreenTransition = (currentStep: ModularDrawerStep) => {
  const [displayedStep, setDisplayedStep] = useState(currentStep);

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (currentStep !== displayedStep) {
      scale.value = withTiming(0.95, TRANSITION_CONFIG);
      translateY.value = withTiming(32, TRANSITION_CONFIG);
      opacity.value = withTiming(0, TRANSITION_CONFIG, () => {
        runOnJS(setDisplayedStep)(currentStep);

        scale.value = 0.95;
        translateY.value = 32;
        opacity.value = 0;

        scale.value = withTiming(1, TRANSITION_CONFIG);
        translateY.value = withTiming(0, TRANSITION_CONFIG);
        opacity.value = withTiming(1, TRANSITION_CONFIG);
      });
    }
  }, [currentStep, displayedStep, scale, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return { animatedStyle, displayedStep };
};

export default useScreenTransition;
