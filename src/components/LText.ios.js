/* @flow */
import React, { Component } from "react";
import { Text } from "react-native";

export default class LText extends Component<*> {
  render() {
    const { bold, semiBold, secondary, ...newProps } = this.props;
    const fontFamily = secondary ? "Museo Sans" : "Open Sans";
    let fontWeight = secondary ? -200 : 0; // Fix for Museo weights being off by 200;

    if (semiBold) {
      fontWeight += 600;
    } else if (bold) {
      fontWeight += 700;
    } else {
      fontWeight += 400;
    }

    const font = { fontFamily, fontWeight: fontWeight.toString() };
    const style = this.props.style ? [this.props.style, font] : font;

    return <Text {...newProps} style={style} />;
  }
}
