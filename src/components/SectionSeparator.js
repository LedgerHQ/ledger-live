/* @flow */

import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import colors from "../colors";
import LText from "./LText";

type Props = {
  thin?: boolean,
  lineColor?: string,
  text?: React$Node,
  textStyle?: string,
  style?: {},
};

export default class SectionSeparator extends Component<Props> {
  render() {
    const { thin, lineColor, text, textStyle, style } = this.props;
    const lineStyle = [
      styles.line,
      thin && styles.thin,
      lineColor && { backgroundColor: lineColor },
    ];
    return (
      <View style={[styles.root, style]}>
        <View style={lineStyle} />
        {text && (
          <LText semibold style={[styles.text, textStyle]}>
            {text}
          </LText>
        )}
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
  text: {
    marginHorizontal: 11,
    color: colors.fog,
  },
  line: {
    backgroundColor: colors.fog,
    height: 2,
    flexGrow: 1,
  },
  thin: {
    height: 1,
  },
});
