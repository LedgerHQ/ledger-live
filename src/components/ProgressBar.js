// @flow

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";

type Props = {
  style?: *,
  height: number,
  progress: string,
  progressColor: string,
  backgroundColor: string,
};

function ProgressBar({
  style,
  height,
  backgroundColor,
  progressColor,
  progress,
}: Props) {
  const { colors } = useTheme();
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
            width: `${progress}%`,
          },
        ]}
      />
    </View>
  );
}

ProgressBar.defaultProps = {
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
    borderRadius: 6,
  },
});

export default memo<Props>(ProgressBar);
