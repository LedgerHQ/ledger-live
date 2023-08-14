import React, { useCallback, useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";
import LText from "./LText";

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
  // Index of the `value` in `options`
  const [activeIndex, setActiveIndex] = useState(0);
  // Animated value that will be updated to be equal to `activeIndex`
  const animatedIndex = useSharedValue(0);

  const onLayout = useCallback(evt => {
    setWidth(evt.nativeEvent.layout.width);
  }, []);

  // Updates the animated active index
  useEffect(() => {
    const newActiveIndex = options.findIndex(opt => opt.value === value);
    setActiveIndex(newActiveIndex);

    animatedIndex.value = withTiming(newActiveIndex, {
      duration: 150,
    });
  }, [value, options, animatedIndex]);

  // The indicator is the component highlighting the currently active option.
  // `left` is interpolated from the animated-new-active-index state.
  const indicatorStyle = useAnimatedStyle(() => ({
    width: `${100 / options.length}%`,
    left: interpolate(
      animatedIndex.value,
      [0, options.length - 1],
      [0, ((options.length - 1) * width) / options.length],
    ),
  }));

  if (!options.length) return null;

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
