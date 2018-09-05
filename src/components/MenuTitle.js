/* @flow */
import React, { Component } from "react";
import { StyleSheet } from "react-native";
import LText from "./LText";

export default class MenuTitle extends Component<{
  children: *,
}> {
  render() {
    const { children } = this.props;
    return (
      <LText semiBold style={styles.text}>
        {children}
      </LText>
    );
  }
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
  },
});
