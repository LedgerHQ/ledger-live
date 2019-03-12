/* @flow */
import React, { Component } from "react";
import { Text } from "react-native";
import getFontStyle from "./getFontStyle"; // eslint-disable-line

export { getFontStyle };

export type Opts = {
  bold?: boolean,
  semiBold?: boolean,
  secondary?: boolean,
  tertiary?: boolean,
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
 * <LText tertiary>tertiary font</LText>
 * <LText style={styles.text}>some specific styles</LText>
 */
export default class LText extends Component<*> {
  render() {
    const {
      bold,
      semiBold,
      secondary,
      tertiary,
      monospace,
      style,
      ...newProps
    } = this.props;
    return (
      <Text
        {...newProps}
        style={[
          style,
          getFontStyle({ bold, semiBold, secondary, tertiary, monospace }),
        ]}
      />
    );
  }
}
