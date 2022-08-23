/* @flow */
import React, { Component } from "react";
import { Animated } from "react-native";
import getFontStyle from "./getFontStyle";

export { getFontStyle };

/**
 * Usage:
 *
 * <LText>123</LText>
 * <LText bold>toto</LText>
 * <LText semiBold>foobar</LText>
 * <LText secondary>alternate font</LText>
 * <LText style={styles.text}>some specific styles</LText>
 */
export default class AnimatedLText extends Component<*> {
  render() {
    const { bold, semiBold, secondary, style, ...newProps } = this.props;
    return (
      <Animated.Text
        {...newProps}
        style={[style, getFontStyle({ bold, semiBold, secondary })]}
      />
    );
  }
}
