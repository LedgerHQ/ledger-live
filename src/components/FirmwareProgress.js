// @flow
import React, { PureComponent } from "react";
import { StyleSheet } from "react-native";
import ProgressCircle from "react-native-progress/Circle";

import { getFontStyle } from "./LText";
import colors from "../colors";

type Props = {
  progress: number,
  size: number,
};

class FirmwareProgress extends PureComponent<Props> {
  render() {
    const { progress, size } = this.props;
    return (
      <ProgressCircle
        showsText={!!progress}
        progress={progress}
        color={colors.live}
        borderWidth={0}
        thickness={progress ? 4 : 0}
        size={size}
        strokeCap="round"
        textStyle={[styles.progressText, getFontStyle({ semiBold: true })]}
      />
    );
  }
}

const styles = StyleSheet.create({
  progressText: {
    color: colors.live,
    fontSize: 16,
  },
});

export default FirmwareProgress;
