import React, { useCallback, useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Animated, { EasingNode } from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";
import LText from "./LText";

const {
  cond,
  set,
  block,
  clockRunning,
  startClock,
  timing,
  Clock,
  Value,
  interpolateNode,
} = Animated;

/**
 * @param {Animated.Clock} clock animation clock
 * @param {Animated.Value} value current position
 * @param {Animated.Value} dest position to interpolate to
 * @returns {Animated.Node<number>}
 */
const runTranslate = (
  clock: Animated.Clock,
  value: Animated.Value<number> | number,
  dest: Animated.Value<number> | number,
) => {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0),
  };
  const config = {
    duration: new Value(150),
    toValue: new Value(1),
    easing: EasingNode.inOut(EasingNode.quad),
  };
  return block([
    // if clock running reset timer and switch position
    cond(clockRunning(clock), 0, [
      // reset running state
      set(state.finished, 0), // reset time
      set(state.time, 0), // reset frame time count
      set(state.frameTime, 0), // set current anim position
      set(state.position, value), // set new anim destination
      set(config.toValue, dest), // start clock animation
      startClock(clock),
    ]), // run clock timing
    timing(clock, state, config), // return anim position
    state.position,
  ]);
};

type Props = {
  value: string;
  disabled?: boolean;
  options: Array<{
    value: string;
    label: string | React.ReactNode;
    disabled?: boolean;
  }>;
  onChange: (_: string) => void;
};

const ToggleButton = ({ value, options, onChange }: Props) => {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  // animation translate state
  const [animIndex] = useState(new Value(0));
  const onLayout = useCallback(evt => {
    setWidth(evt.nativeEvent.layout.width);
  }, []);
  if (!options.length) return null;
  const activeIndex = options.findIndex(opt => opt.value === value);
  // animation clock
  const clock = new Clock();
  // animation opening anim node
  const openingAnim = block([
    // opening
    set(animIndex, runTranslate(clock, animIndex, activeIndex)),
    animIndex,
  ]);
  // interpolated height from opening anim state for list container
  const left = interpolateNode(openingAnim, {
    inputRange: [0, options.length - 1],
    outputRange: [0, ((options.length - 1) * width) / options.length],
  });
  const indicatorStyle = {
    width: `${100 / options.length}%`,
    left,
  };
  return (
    <View
      style={[
        styles.mainContainer,
        {
          borderColor: colors.live,
        },
      ]}
      onLayout={onLayout}
    >
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: colors.live,
          },
          indicatorStyle,
        ]}
      />
      <View style={styles.container}>
        {options.map(({ value, label, disabled }, index) => (
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.optionButton,
              disabled
                ? {
                    backgroundColor: colors.lightFog,
                  }
                : undefined,
            ]}
            key={`ToggleButton_${value}_${index}`}
            disabled={disabled}
            onPress={() => onChange(value)}
          >
            <LText
              semiBold
              style={[
                styles.label,
                disabled
                  ? {
                      color: colors.fog,
                    }
                  : undefined,
              ]}
              color={activeIndex === index ? "white" : "live"}
            >
              {label}
            </LText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    width: "auto",
    height: 32,
    position: "relative",
    borderRadius: 32,
    borderWidth: 1,
    overflow: "hidden",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flexWrap: "nowrap",
    width: "100%",
    height: 32,
    position: "relative",
    backgroundColor: "transparent",
  },
  indicator: {
    position: "absolute",
    zIndex: 0,
    height: 32,
    top: 0,
    left: 0,
  },
  label: {
    fontSize: 14,
    lineHeight: 30,
    textAlign: "center",
  },
  optionButton: {
    flex: 1,
    height: 32,
    backgroundColor: "transparent",
    zIndex: 1,
  },
});
export default ToggleButton;
