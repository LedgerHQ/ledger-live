// @flow

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import type { ViewStyleProp } from "react-native/Libraries/StyleSheet/StyleSheet";
import Animated, { Easing } from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";

const {
  cond,
  set,
  block,
  startClock,
  stopClock,
  timing,
  Clock,
  Value,
  interpolate,
} = Animated;

const clock = new Clock();

const runProgression = () => {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0),
  };

  const config = {
    duration: new Value(1000),
    toValue: new Value(1),
    easing: Easing.inOut(Easing.quad),
  };

  return block([
    // start right away
    startClock(clock),
    // process your state
    timing(clock, state, config),
    // when over (processed by timing at the end)
    cond(state.finished, [
      // we stop
      stopClock(clock),
      // set flag ready to be restarted
      set(state.finished, 0),
      // same value as the initial defined in the state creation
      set(state.position, 0),
      // reset timer and frame
      set(state.time, 0),
      set(state.frameTime, 0),
      // and we restart
      startClock(clock),
    ]),
    state.position,
  ]);
};

const progress = runProgression();

type Props = {
  height: number,
  progressColor: string,
  backgroundColor: string,
  style?: ViewStyleProp,
};

const InfiniteProgressBar = ({
  style,
  height,
  progressColor,
  backgroundColor,
}: Props) => {
  const { colors } = useTheme();

  const scaleX = interpolate(progress, {
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.9, 0],
  });
  const translateX = interpolate(progress, {
    inputRange: [0, 0.6, 1],
    outputRange: [-100, 0, 100],
  });

  return (
    <View
      style={[
        styles.wrapper,
        { height, backgroundColor: backgroundColor || colors.lightFog },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.bar,
          {
            backgroundColor: progressColor,
            transform: [{ translateX }, { scaleX }],
          },
        ]}
      />
    </View>
  );
};

InfiniteProgressBar.defaultProps = {
  height: 6,
};

const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 1,
    borderRadius: 6,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
  },
});

export default memo<Props>(InfiniteProgressBar);
