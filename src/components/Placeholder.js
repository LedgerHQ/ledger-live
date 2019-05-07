// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import colors from "../colors";

class Placeholder extends PureComponent<{
  width?: number,
  containerHeight?: number,
  style?: *,
}> {
  render() {
    const { width, containerHeight, style } = this.props;
    return (
      <View
        style={[
          styles.root,
          containerHeight ? { height: containerHeight } : null,
        ]}
      >
        <View style={[styles.inner, { width: width || 100 }, style]} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    justifyContent: "center",
  },
  inner: {
    height: 8,
    backgroundColor: colors.fog,
    borderRadius: 4,
  },
});

export default Placeholder;
