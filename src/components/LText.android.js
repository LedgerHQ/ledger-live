/* @flow */
import React, { Component } from "react";
import { Text } from "react-native";

export default class LText extends Component<*> {
  render() {
    const { bold, semiBold, secondary, ...newProps } = this.props;
    const family = secondary ? "MuseoSans" : "OpenSans";
    let weight;

    if (semiBold) {
      weight = "SemiBold";
    } else if (bold) {
      weight = "Bold";
    } else {
      weight = "Regular";
    }

    const font = { fontFamily: `${family}-${weight}` };
    const style = this.props.style ? [this.props.style, font] : font;

    return <Text {...newProps} style={style} />;
  }
}
