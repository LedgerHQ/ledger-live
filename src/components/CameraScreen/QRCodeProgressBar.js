// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import ProgressCircle from "react-native-progress/Circle";

import { getFontStyle } from "../LText";

import colors from "../../colors";

type Props = {
  progress?: number,
  viewFinderSize: number,
};

class QrCodeProgressBar extends PureComponent<Props> {
  render() {
    const { progress, viewFinderSize } = this.props;
    return typeof progress === "number" ? (
      <View style={styles.centered}>
        <ProgressCircle
          showsText={!!progress}
          progress={progress}
          color={colors.white}
          borderWidth={0}
          thickness={progress ? 4 : 0}
          size={viewFinderSize / 4}
          strokeCap="round"
          textStyle={[
            styles.progressText,
            getFontStyle({ tertiary: true, semiBold: true }),
          ]}
        />
      </View>
    ) : null;
  }
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    color: colors.white,
    fontSize: 16,
  },
});

export default QrCodeProgressBar;
