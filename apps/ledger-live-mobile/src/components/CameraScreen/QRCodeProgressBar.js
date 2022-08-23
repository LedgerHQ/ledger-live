// @flow
import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import ProgressCircle from "react-native-progress/Circle";

import { getFontStyle } from "../LText";

type Props = {
  progress?: number,
  viewFinderSize: number,
};

function QrCodeProgressBar({ progress, viewFinderSize }: Props) {
  return typeof progress === "number" ? (
    <View style={styles.centered}>
      <ProgressCircle
        showsText={!!progress}
        progress={progress}
        color={"fff"}
        borderWidth={0}
        thickness={progress ? 4 : 0}
        size={viewFinderSize / 4}
        strokeCap="round"
        textStyle={[styles.progressText, getFontStyle({ semiBold: true })]}
      />
    </View>
  ) : null;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: 16,
    color: "#fff",
  },
});

export default memo<Props>(QrCodeProgressBar);
