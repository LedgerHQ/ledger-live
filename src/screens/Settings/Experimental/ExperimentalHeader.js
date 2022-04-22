// @flow
import React, { useState, useCallback } from "react";
import { StyleSheet, TouchableOpacity, Platform } from "react-native";
import Animated, { Extrapolate } from "react-native-reanimated";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import Config from "react-native-config";
import { useExperimental } from "../../../experimental";
import { runCollapse } from "../../../components/CollapsibleList";
import LText from "../../../components/LText";
import ExperimentalIcon from "../../../icons/Experimental";
import { rejections } from "../../../logic/debugReject";

const { cond, set, Clock, Value, interpolateNode, eq } = Animated;
export const HEIGHT = Platform.OS === "ios" ? 70 : 30;

function ExperimentalHeader({ isExperimental }: { isExperimental: boolean }) {
  const { colors } = useTheme();

  const clock = new Clock();
  // animation Open state
  const [openState] = useState(new Value(Config.MOCK ? 1 : 0));
  // animation opening anim node
  const openingAnim = cond(
    !Config.MOCK,
    cond(
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
    ),
    openState,
  );

  // interpolated height from opening anim state for list container
  const height = interpolateNode(openingAnim, {
    inputRange: [0, 1],
    outputRange: [0, HEIGHT],
    extrapolate: Extrapolate.CLAMP,
  });

  const onPressMock = useCallback(() => {
    rejections.next();
  }, []);

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
        {isExperimental && (
          <>
            <ExperimentalIcon size={16} color={colors.live} />
            <LText bold style={styles.label}>
              <Trans i18nKey="settings.experimental.title" />
            </LText>
          </>
        )}

        {Config.MOCK ? (
          <TouchableOpacity onPress={onPressMock}>
            <LText bold style={styles.label}>
              MOCK
            </LText>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

export default function ExpHeader() {
  const isExperimental = useExperimental();

  return isExperimental ? (
    <ExperimentalHeader isExperimental={isExperimental} />
  ) : null;
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
