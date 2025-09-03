import { useState, useEffect, useCallback } from "react";
import {
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
  useAnimatedStyle,
} from "react-native-reanimated";
import { ModularDrawerStep } from "../types";

const isTestEnv = typeof jest !== "undefined" || process.env.JEST_WORKER_ID !== undefined;

const TRANSITION_CONFIG = {
  duration: isTestEnv ? 0 : 250,
  easing: Easing.bezier(0.17, 0.84, 0.44, 1),
};

const COMMON_POSITION_STYLES = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const useScreenTransition = (currentStep: ModularDrawerStep) => {
  const [activeSteps, setActiveSteps] = useState<ModularDrawerStep[]>([currentStep]);

  const assetScale = useSharedValue(1);
  const assetTranslateY = useSharedValue(0);
  const assetOpacity = useSharedValue(1);
  const networkScale = useSharedValue(0.95);
  const networkTranslateY = useSharedValue(0);
  const networkOpacity = useSharedValue(1);
  const accountScale = useSharedValue(0.95);
  const accountTranslateY = useSharedValue(0);
  const accountOpacity = useSharedValue(1);

  const assetAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: assetScale.value }, { translateY: assetTranslateY.value }],
      opacity: assetOpacity.value,
      ...COMMON_POSITION_STYLES,
    }),
    [assetScale, assetTranslateY, assetOpacity],
  );

  const networkAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: networkScale.value }, { translateY: networkTranslateY.value }],
      opacity: networkOpacity.value,
      ...COMMON_POSITION_STYLES,
    }),
    [networkScale, networkTranslateY, networkOpacity],
  );

  const accountAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: accountScale.value }, { translateY: accountTranslateY.value }],
      opacity: accountOpacity.value,
      ...COMMON_POSITION_STYLES,
    }),
    [accountScale, accountTranslateY, accountOpacity],
  );

  const removeStep = useCallback((stepToRemove: ModularDrawerStep) => {
    setActiveSteps(prev => prev.filter(step => step !== stepToRemove));
  }, []);

  const getStepAnimationData = useCallback(
    (step: ModularDrawerStep) => {
      switch (step) {
        case ModularDrawerStep.Asset:
          return {
            scale: assetScale,
            translateY: assetTranslateY,
            opacity: assetOpacity,
            animatedStyle: assetAnimatedStyle,
          };
        case ModularDrawerStep.Network:
          return {
            scale: networkScale,
            translateY: networkTranslateY,
            opacity: networkOpacity,
            animatedStyle: networkAnimatedStyle,
          };
        case ModularDrawerStep.Account:
          return {
            scale: accountScale,
            translateY: accountTranslateY,
            opacity: accountOpacity,
            animatedStyle: accountAnimatedStyle,
          };
        default:
          return null;
      }
    },
    [
      assetScale,
      assetTranslateY,
      assetOpacity,
      assetAnimatedStyle,
      networkScale,
      networkTranslateY,
      networkOpacity,
      networkAnimatedStyle,
      accountScale,
      accountTranslateY,
      accountOpacity,
      accountAnimatedStyle,
    ],
  );

  const animateStepIn = useCallback(
    (step: ModularDrawerStep) => {
      const stepData = getStepAnimationData(step);
      if (stepData) {
        stepData.scale.value = withTiming(1, TRANSITION_CONFIG);
        stepData.translateY.value = withTiming(0, TRANSITION_CONFIG);
        stepData.opacity.value = withTiming(1, TRANSITION_CONFIG);
      }
    },
    [getStepAnimationData],
  );

  const animateStepOut = useCallback(
    (step: ModularDrawerStep) => {
      const stepData = getStepAnimationData(step);
      if (stepData) {
        stepData.scale.value = withTiming(0.95, TRANSITION_CONFIG);
        stepData.translateY.value = withTiming(32, TRANSITION_CONFIG);
        stepData.opacity.value = withTiming(0, TRANSITION_CONFIG, () => {
          runOnJS(removeStep)(step);
        });
      }
    },
    [getStepAnimationData, removeStep],
  );

  const handleStepTransition = useCallback(
    (newStep: ModularDrawerStep, previousSteps: ModularDrawerStep[]) => {
      const isNewStep = !previousSteps.includes(newStep);

      if (isNewStep) {
        const newSteps = [...previousSteps, newStep];

        animateStepIn(newStep);
        previousSteps.forEach(oldStep => {
          if (oldStep !== newStep) {
            animateStepOut(oldStep);
          }
        });

        return newSteps;
      }

      return previousSteps;
    },
    [animateStepIn, animateStepOut],
  );

  useEffect(() => {
    setActiveSteps(prev => handleStepTransition(currentStep, prev));
  }, [currentStep, handleStepTransition]);

  const getStepAnimations = useCallback(
    (step: ModularDrawerStep) => {
      const stepData = getStepAnimationData(step);
      return stepData ? { animatedStyle: stepData.animatedStyle } : null;
    },
    [getStepAnimationData],
  );

  return { activeSteps, getStepAnimations };
};

export default useScreenTransition;
