// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import LText from "./LText";

import colors from "../colors";

class ErrorBadge extends PureComponent<{
  style?: *,
  children: React$Node,
}> {
  static defaultProps = {
    children: "!",
  };

  render() {
    const { style, children } = this.props;
    return (
      <View style={[styles.outer, style]}>
        <View style={styles.inner}>
          <LText bold style={styles.txt}>
            {children}
          </LText>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  outer: {
    padding: 0,
    borderRadius: 16,
    top: -12,
    right: -12,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.alert,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  txt: {
    color: colors.white,
  },
});

export default ErrorBadge;
