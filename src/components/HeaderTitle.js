/* @flow */
import React, { Component } from "react";
import { StyleSheet } from "react-native";
import LText from "./LText";
import colors from "../colors";

class HeaderTitle extends Component<*> {
  render() {
    const { children } = this.props;

    return (
      <LText secondary semiBold style={style.root}>
        {children}
      </LText>
    );
  }
}

export default HeaderTitle;

const style = StyleSheet.create({
  root: {
    color: colors.darkBlue,
    fontSize: 16,
  },
});
