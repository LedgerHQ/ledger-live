import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import type { QueuedDrawerFlowScreenRegistry } from "./types";

const isTestEnv = typeof jest !== "undefined" || process.env.JEST_WORKER_ID !== undefined;

const TRANSITION_CONFIG = {
  duration: isTestEnv ? 0 : 250,
  easing: Easing.bezier(0.17, 0.84, 0.44, 1),
};

const SCREEN_STYLE = {
  position: "absolute" as const,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

type ActiveScreen<Step extends string> = Readonly<{
  step: Step;
  content: QueuedDrawerFlowScreenRegistry<Step>[Step]["content"];
  isEntering: boolean;
  isExiting: boolean;
}>;

type QueuedDrawerScreenTransitionProps<Step extends string> = Readonly<{
  currentStep: Step;
  screens: QueuedDrawerFlowScreenRegistry<Step>;
}>;

type QueuedDrawerAnimatedScreenProps<Step extends string> = Readonly<{
  screen: ActiveScreen<Step>;
  onExitComplete: (step: Step) => void;
}>;

function QueuedDrawerAnimatedScreen<Step extends string>({
  screen,
  onExitComplete,
}: QueuedDrawerAnimatedScreenProps<Step>): React.JSX.Element {
  const scale = useSharedValue(screen.isEntering ? 0.95 : 1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
      opacity: opacity.value,
      ...SCREEN_STYLE,
    }),
    [opacity, scale, translateY],
  );

  useEffect(() => {
    if (screen.isExiting) {
      scale.value = withTiming(0.95, TRANSITION_CONFIG);
      translateY.value = withTiming(32, TRANSITION_CONFIG);
      opacity.value = withTiming(0, TRANSITION_CONFIG, () => {
        scheduleOnRN(onExitComplete, screen.step);
      });
      return;
    }

    if (screen.isEntering) {
      scale.value = withTiming(1, TRANSITION_CONFIG);
      translateY.value = withTiming(0, TRANSITION_CONFIG);
      opacity.value = withTiming(1, TRANSITION_CONFIG);
    }
  }, [
    onExitComplete,
    opacity,
    scale,
    screen.isEntering,
    screen.isExiting,
    screen.step,
    translateY,
  ]);

  return <Animated.View style={[{ flex: 1 }, animatedStyle]}>{screen.content}</Animated.View>;
}

export function QueuedDrawerScreenTransition<Step extends string>({
  currentStep,
  screens,
}: QueuedDrawerScreenTransitionProps<Step>): React.JSX.Element {
  const currentContent = screens[currentStep].content;
  const [activeScreens, setActiveScreens] = useState<readonly ActiveScreen<Step>[]>(() => [
    { step: currentStep, content: currentContent, isEntering: false, isExiting: false },
  ]);

  const removeScreen = useCallback((step: Step) => {
    setActiveScreens(previousScreens => previousScreens.filter(screen => screen.step !== step));
  }, []);

  useEffect(() => {
    setActiveScreens(previousScreens => {
      const currentScreen = previousScreens.find(screen => screen.step === currentStep);
      if (currentScreen) {
        return currentScreen.content === currentContent
          ? previousScreens
          : previousScreens.map(screen =>
              screen.step === currentStep ? { ...screen, content: currentContent } : screen,
            );
      }

      if (isTestEnv) {
        return [
          { step: currentStep, content: currentContent, isEntering: false, isExiting: false },
        ];
      }

      return [
        ...previousScreens.map(screen => ({ ...screen, isExiting: true })),
        { step: currentStep, content: currentContent, isEntering: true, isExiting: false },
      ];
    });
  }, [currentContent, currentStep]);

  return (
    <View style={{ flex: 1, position: "relative" }}>
      {activeScreens.map(screen => (
        <QueuedDrawerAnimatedScreen
          key={screen.step}
          onExitComplete={removeScreen}
          screen={screen}
        />
      ))}
    </View>
  );
}
