/* @flow */
import React, { Component } from "react";
import { Text } from "react-native";
import getFontStyle from "./getFontStyle";

export default class LText extends Component<*> {
  render() {
    const { bold, semiBold, secondary, style, ...newProps } = this.props;
    return (
      <Text
        {...newProps}
        style={[style, getFontStyle({ bold, semiBold, secondary })]}
      />
    );
  }
}
