import React, { useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-common/env";
import { useTheme } from "@react-navigation/native";
import { themeSelector } from "../reducers/settings";
import { setTheme } from "../actions/settings";

const DebugTheme = () => {
  const pan = useRef(new Animated.ValueXY()).current;
  const { height, width } = useWindowDimensions();
  const currentTheme = useSelector(themeSelector);
  const { colors } = useTheme();
  const isDark = currentTheme === "dark";
  const render = useEnv("DEBUG_THEME");
  const dispatch = useDispatch();

  const toggleTheme = useCallback(() => {
    dispatch(setTheme(isDark ? "light" : "dark"));
  }, [isDark, dispatch]);

  const toggleDebugThemeVisibility = useCallback(() => {
    setEnv("DEBUG_THEME", !render);
  }, [render]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) =>
        Math.abs(gestureState.dx) > 5,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.extractOffset();
      },
    }),
  ).current;

  return render ? (
    <Animated.View
      style={[
        {
          transform: [
            {
              translateX: pan.x.interpolate({
                inputRange: [0, width - 30],
                outputRange: [0, width - 30],
                extrapolate: "clamp",
              }),
            },
            {
              translateY: pan.y.interpolate({
                inputRange: [-60, height - 90],
                outputRange: [-60, height - 90],
                extrapolate: "clamp",
              }),
            },
          ],
        },
        styles.wrap,
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableWithoutFeedback
        onPress={toggleTheme}
        onLongPress={toggleDebugThemeVisibility}
      >
        <View style={[styles.box, { backgroundColor: colors.black }]} />
      </TouchableWithoutFeedback>
    </Animated.View>
  ) : null;
};

const styles = StyleSheet.create({
  wrap: {
    zIndex: 999,
    flex: 1,
    position: "absolute",
    top: 60,
    left: 0,
  },
  box: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: "red",
  },
});

export default DebugTheme;
