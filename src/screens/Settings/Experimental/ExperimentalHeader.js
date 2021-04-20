// @flow
import React, { useState } from "react";
import { StyleSheet, Platform } from "react-native";
import Animated, { Extrapolate } from "react-native-reanimated";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import useExperimental from "./useExperimental";
import { runCollapse } from "../../../components/CollapsibleList";
import LText from "../../../components/LText";
import ExperimentalIcon from "../../../icons/Experimental";

const { cond, set, Clock, Value, interpolateNode, eq } = Animated;

export default function ExperimentalHeader() {
  const { colors } = useTheme();
  const isExperimental = useExperimental();

  const clock = new Clock();
  // animation Open state
  const [openState] = useState(new Value(0));
  // animation opening anim node
  const openingAnim = cond(
    eq(isExperimental, true),
    [
      // opening
      set(openState, runCollapse(clock, openState, 1)),
      openState,
    ],
    [
      // closing
      set(openState, runCollapse(clock, openState, 0)),
      openState,
    ],
  );

  // interpolated height from opening anim state for list container
  const height = interpolateNode(openingAnim, {
    inputRange: [0, 1],
    outputRange: [0, Platform.OS === "ios" ? 70 : 30],
    extrapolate: Extrapolate.CLAMP,
  });

  return (
    <Animated.View
      style={[styles.root, { height, backgroundColor: colors.lightLiveBg }]}
    >
      <Animated.View
        style={[
          styles.container,
          { opacity: openingAnim, backgroundColor: colors.lightLiveBg },
        ]}
      >
        <ExperimentalIcon size={16} color={colors.live} />
        <LText bold style={styles.label}>
          <Trans i18nKey="settings.experimental.title" />
        </LText>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    position: "relative",
    overflow: "visible",
    zIndex: 1,
  },
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 0 : -30,
    left: 0,
    width: "100%",
    height: 38,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginLeft: 8,
    fontSize: 12,
  },
});
