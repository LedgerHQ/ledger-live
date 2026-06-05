import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useFeature } from "@features/platform-feature-flags";
import { COMPANION_STATE } from "../../types";
import { UseSecondStepSyncOnboardingViewModelProps } from "./types";

const ENTRY_TIMING = 300;
const ENTRY_OPACITY_TIMING = 400;
const EXIT_TIMING = 400;
const fallbackDefaultAppsToInstall = ["Bitcoin", "Ethereum", "Polygon"];

export const useSecondStepSyncOnboardingViewModel = ({
  companionStep,
  handleDone,
  analyticsSeedConfiguration,
}: UseSecondStepSyncOnboardingViewModelProps) => {
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const deviceInitialApps = useFeature("deviceInitialApps");

  const initialAppsToInstall =
    deviceInitialApps?.enabled &&
    Array.isArray(deviceInitialApps.params?.apps) &&
    deviceInitialApps.params.apps.length > 0
      ? deviceInitialApps.params.apps
      : fallbackDefaultAppsToInstall;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sharedHeight = useSharedValue<number | null>(null);
  const sharedOpacity = useSharedValue<number>(0);
  const derivedOpacity = useDerivedValue(() => {
    return sharedOpacity.value / 100;
  });
  const animatedStyle = useAnimatedStyle(
    () => ({
      /**
       * When sharedHeight.value is null we treat it as 0 so that the component
       * starts collapsed and can animate its height from 0 to the measured value
       * once handleLayout has run.
       */
      height: sharedHeight.value ?? 0,
    }),
    [sharedHeight],
  );
  const animatedOpacityStyle = useAnimatedStyle(
    () => ({
      opacity: derivedOpacity.value,
    }),
    [derivedOpacity],
  );

  const handleLayout = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      sharedHeight.value = withTiming(layout.height, { duration: ENTRY_TIMING });
    },
    [sharedHeight],
  );

  const handleExit = useCallback(
    (done: boolean) => {
      if (!done || analyticsSeedConfiguration.current === "new_seed") {
        return handleDone(done);
      }
      setIsFinished(true);
      sharedHeight.value = withTiming(0, { duration: EXIT_TIMING });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      timeoutRef.current = setTimeout(() => {
        handleDone(done);
      }, 800);
    },
    [handleDone, sharedHeight, setIsFinished, analyticsSeedConfiguration],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (companionStep === COMPANION_STATE.SETUP || companionStep === COMPANION_STATE.EXIT) {
      sharedOpacity.value = withTiming(0, { duration: EXIT_TIMING });
    } else {
      sharedOpacity.value = withTiming(100, { duration: ENTRY_OPACITY_TIMING });
    }
  }, [companionStep, sharedOpacity]);

  return {
    animatedStyle,
    animatedOpacityStyle,
    handleLayout,
    handleExit,
    initialAppsToInstall,
    isFinished,
  };
};
