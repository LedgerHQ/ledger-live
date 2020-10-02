/* @flow */

import React, { Component } from "react";
import { View, StyleSheet, PixelRatio } from "react-native";
import Icon from "react-native-vector-icons/dist/Ionicons";
import colors from "../colors";

type Props = {
  thin?: boolean,
  lineColor?: string,
  children?: any,
  noMargin?: boolean,
  style?: *,
};

export const ArrowDownCircle = ({
  size = 24,
  big,
}: {
  size?: number,
  big?: boolean,
}) => (
  <View style={[styles.circle, big ? { width: 36, height: 36 } : null]}>
    <Icon
      name={"ios-arrow-round-down"}
      size={big ? 32 : size}
      color={colors.live}
    />
  </View>
);

export default class SectionSeparator extends Component<Props> {
  render() {
    const { thin, lineColor, children, style, noMargin } = this.props;
    const lineStyle = [
      styles.line,
      thin && styles.thin,
      lineColor && { backgroundColor: lineColor },
    ];
    return (
      <View style={[styles.root, style]}>
        <View style={lineStyle} />
        {children ? (
          <View style={noMargin ? null : styles.node}>{children}</View>
        ) : null}
        <View style={lineStyle} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
  },
  circle: {
    borderWidth: 1,
    borderColor: colors.lightFog,
    borderRadius: 100,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  node: {
    marginHorizontal: 11,
    color: colors.lightFog,
  },
  line: {
    backgroundColor: colors.lightFog,
    height: 4 / PixelRatio.get(),
    flexGrow: 1,
  },
  thin: {
    height: 2 / PixelRatio.get(),
  },
});
