// @flow
import React, { memo } from "react";
import { StyleSheet } from "react-native";
import ProgressCircle from "react-native-progress/Circle";
import { useTheme } from "@react-navigation/native";
import { getFontStyle } from "./LText";

type Props = {
  progress: number,
  size: number,
};

function FirmwareProgress({ progress, size }: Props) {
  const { colors } = useTheme();
  return (
    <ProgressCircle
      showsText={!!progress}
      progress={progress}
      color={colors.live}
      borderWidth={0}
      thickness={progress ? 4 : 0}
      size={size}
      strokeCap="round"
      textStyle={[
        styles.progressText,
        { color: colors.live },
        getFontStyle({ semiBold: true }),
      ]}
    />
  );
}

const styles = StyleSheet.create({
  progressText: {
    fontSize: 16,
  },
});

export default memo<Props>(FirmwareProgress);
