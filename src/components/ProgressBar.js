// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import colors from "../colors";

type Props = {
  style?: *,
  height: number,
  progress: string,
  progressColor: string,
  backgroundColor: string,
};

class ProgressBar extends PureComponent<Props> {
  static defaultProps = {
    height: 6,
    backgroundColor: colors.lightFog,
  };

  render() {
    const {
      style,
      height,
      backgroundColor,
      progressColor,
      progress,
    } = this.props;
    return (
      <View style={[styles.wrapper, { height, backgroundColor }, style]}>
        <View
          style={[
            styles.bar,
            { width: `${progress}%`, backgroundColor: progressColor },
          ]}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 1,
    borderRadius: 6,
  },
  bar: {
    height: "100%",
    borderRadius: 6,
  },
});

export default ProgressBar;
