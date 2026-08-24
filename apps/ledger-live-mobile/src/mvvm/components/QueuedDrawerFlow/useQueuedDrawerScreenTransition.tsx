import React from "react";
import { View } from "react-native";
import Animated, { Easing, withTiming } from "react-native-reanimated";
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

type QueuedDrawerScreenTransitionProps<Step extends string> = Readonly<{
  currentStep: Step;
  screens: QueuedDrawerFlowScreenRegistry<Step>;
}>;

function customEntering() {
  "worklet";

  return {
    initialValues: { transform: [{ scale: 0.95 }] },
    animations: { transform: [{ scale: withTiming(1, TRANSITION_CONFIG) }] },
  };
}

function customExiting() {
  "worklet";

  return {
    initialValues: { transform: [{ scale: 1 }, { translateY: 0 }], opacity: 1 },
    animations: {
      transform: [
        { scale: withTiming(0.95, TRANSITION_CONFIG) },
        { translateY: withTiming(32, TRANSITION_CONFIG) },
      ],
      opacity: withTiming(0, TRANSITION_CONFIG),
    },
  };
}

export function QueuedDrawerScreenTransition<Step extends string>({
  currentStep,
  screens,
}: QueuedDrawerScreenTransitionProps<Step>): React.JSX.Element {
  return (
    <View style={{ flex: 1, position: "relative" }}>
      <Animated.View
        key={currentStep}
        entering={customEntering}
        exiting={customExiting}
        style={[{ flex: 1 }, SCREEN_STYLE]}
      >
        {screens[currentStep].content}
      </Animated.View>
    </View>
  );
}
