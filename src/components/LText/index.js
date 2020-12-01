/* @flow */
import React, { Component } from "react";
import { Text } from "react-native";
import getFontStyle from "./getFontStyle";

export { getFontStyle };

export type Opts = {
  bold?: boolean,
  semiBold?: boolean,
  secondary?: boolean,
  monospace?: boolean,
};

export type Res = {
  fontFamily: string,
  fontWeight:
    | "normal"
    | "bold"
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900",
};

/**
 * Usage:
 *
 * <LText>123</LText>
 * <LText bold>toto</LText>
 * <LText semiBold>foobar</LText>
 * <LText secondary>alternate font</LText>
 * <LText style={styles.text}>some specific styles</LText>
 */
export default class LText extends Component<*> {
  render() {
    const {
      bold,
      semiBold,
      secondary,
      monospace,
      style,
      ...newProps
    } = this.props;
    return (
      <Text
        allowFontScaling={false}
        {...newProps}
        style={[style, getFontStyle({ bold, semiBold, secondary, monospace })]}
      />
    );
  }
}
