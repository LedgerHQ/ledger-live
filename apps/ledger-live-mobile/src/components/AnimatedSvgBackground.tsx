import React, { memo } from "react";
import type { ViewStyleProp } from "react-native/Libraries/StyleSheet/StyleSheet";
import Animated, { EasingNode } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { interpolatePath } from "react-native-redash/lib/module/v1";
import Config from "react-native-config";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const paths = [
  "M0 241L17.8667 236.215C35.4667 231.43 71.2 221.859 106.667 220.264C142.133 218.669 177.867 225.05 213.333 223.454C248.8 221.859 284.533 212.289 302.133 207.504L320 202.719V0H302.133C284.533 0 248.8 0 213.333 0C177.867 0 142.133 0 106.667 0C71.2 0 35.4667 0 17.8667 0H0V241Z",
  "M0 199.151L17.8667 202.337C35.4667 205.523 71.2 211.896 106.667 216.675C142.133 221.454 177.867 224.64 213.333 218.268C248.8 211.896 284.533 195.965 302.133 188L320 180.035V0H302.133C284.533 0 248.8 0 213.333 0C177.867 0 142.133 0 106.667 0C71.2 0 35.4667 0 17.8667 0H0L0 199.151Z",
  "M0 136.78L17.8667 143.407C35.4667 150.035 71.2 163.29 106.667 183.173C142.133 203.056 177.867 229.566 213.333 236.194C248.8 242.821 284.533 229.566 302.133 222.939L320 216.311V0H302.133C284.533 0 248.8 0 213.333 0C177.867 0 142.133 0 106.667 0C71.2 0 35.4667 0 17.8667 0H0V136.78Z",
  "M0 241L17.8667 236.215C35.4667 231.43 71.2 221.859 106.667 220.264C142.133 218.669 177.867 225.05 213.333 223.454C248.8 221.859 284.533 212.289 302.133 207.504L320 202.719V0H302.133C284.533 0 248.8 0 213.333 0C177.867 0 142.133 0 106.667 0C71.2 0 35.4667 0 17.8667 0H0V241Z",
];
const { cond, set, block, startClock, stopClock, timing, Clock, Value } =
  Animated;
const clock = new Clock();

const runProgression = () => {
  if (Config.MOCK) return undefined;
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0),
  };
  const config = {
    duration: new Value(20000),
    toValue: new Value(1),
    easing: EasingNode.inOut(EasingNode.quad),
  };
  return block([
    // start right away
    startClock(clock), // process your state
    timing(clock, state, config), // when over (processed by timing at the end)
    cond(state.finished, [
      // we stop
      stopClock(clock), // set flag ready to be restarted
      set(state.finished, 0), // same value as the initial defined in the state creation
      set(state.position, 0), // reset timer and frame
      set(state.time, 0),
      set(state.frameTime, 0), // and we restart
      startClock(clock),
    ]),
    state.position,
  ]);
};

const progress = runProgression();
type Props = {
  color: string;
  style?: ViewStyleProp;
};

const AnimatedSvgBackground = ({ style, color }: Props) => {
  const d = interpolatePath(progress, {
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: paths,
  });
  return (
    <Svg style={style} viewBox="0 0 320 250" preserveAspectRatio="none">
      <AnimatedPath d={d} fill={color} />
    </Svg>
  );
};

export default memo<Props>(AnimatedSvgBackground);
