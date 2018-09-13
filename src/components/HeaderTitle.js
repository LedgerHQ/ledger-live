/* @flow */
import React, { Component } from "react";
import { StyleSheet } from "react-native";
import LText from "./LText";
import colors from "../colors";

class HeaderTitle extends Component<*> {
  render() {
    const { style, ...newProps } = this.props;

    return (
      <LText
        {...newProps}
        secondary
        semiBold
        style={[styleSheet.root, style]}
      />
    );
  }
}

export default HeaderTitle;

const styleSheet = StyleSheet.create({
  root: {
    color: colors.darkBlue,
    fontSize: 16,
  },
});
