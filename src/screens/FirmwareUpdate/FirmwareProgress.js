// @flow
import React, { PureComponent } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import ProgressCircle from "react-native-progress/Circle";

import { getFontStyle } from "../../components/LText";
import colors from "../../colors";

type Props = {
  progress: number,
};

class FirmwareProgress extends PureComponent<Props> {
  static getViewFinderSize = () => {
    const { width, height } = Dimensions.get("window");

    return Math.round(Math.min(width, height) * (2 / 3));
  };

  render() {
    const viewFinderSize = FirmwareProgress.getViewFinderSize();
    const { progress } = this.props;
    return (
      <View style={styles.centered}>
        <ProgressCircle
          showsText={!!progress}
          progress={progress}
          color={colors.live}
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
    );
  }
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    color: colors.live,
    fontSize: 16,
  },
});

export default FirmwareProgress;
